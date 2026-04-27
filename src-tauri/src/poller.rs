use crate::lhm::{self, LHMResponse, ParsedData, PollStatus};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

pub struct Poller {
    data: Arc<Mutex<Option<ParsedData>>>,
    status: Arc<Mutex<PollStatus>>,
    running: Arc<AtomicBool>,
    update_flag: Arc<AtomicBool>,
}

impl Poller {
    pub fn new() -> Self {
        Self {
            data: Arc::new(Mutex::new(None)),
            status: Arc::new(Mutex::new(PollStatus::Idle)),
            running: Arc::new(AtomicBool::new(false)),
            update_flag: Arc::new(AtomicBool::new(false)),
        }
    }

    pub async fn start(&mut self, ip: String, port: u16, interval_secs: u64) -> Result<(), String> {
        self.stop().await;
        self.running.store(true, Ordering::SeqCst);
        *self.status.lock().unwrap() = PollStatus::Connecting;
        self.update_flag.store(true, Ordering::Relaxed);

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(5))
            .no_proxy()
            .build()
            .map_err(|e| e.to_string())?;

        let base_url = format!("http://{}:{}", ip, port);
        let interval = Duration::from_secs(interval_secs);
        let running = self.running.clone();
        let update_flag = self.update_flag.clone();
        let data = self.data.clone();
        let status = self.status.clone();

        tokio::spawn(async move {
            let mut retry_count: u32 = 0;

            loop {
                if !running.load(Ordering::SeqCst) {
                    break;
                }

                let url = format!("{}/data.json", base_url);
                let start = Instant::now();

                match client.get(&url).send().await {
                    Ok(resp) => {
                        if !running.load(Ordering::SeqCst) {
                            break;
                        }
                        let latency_ms = start.elapsed().as_millis() as u64;
                        let body = resp.text().await;

                        match body {
                            Ok(text) => {
                                match serde_json::from_str::<LHMResponse>(&text) {
                                    Ok(json) => {
                                        let parsed = lhm::parse_lhm_data(&json);

                                        *data.lock().unwrap() = Some(parsed);
                                        *status.lock().unwrap() = PollStatus::Polling {
                                            latency_ms,
                                            last_update: Some(
                                                std::time::SystemTime::now()
                                                    .duration_since(std::time::UNIX_EPOCH)
                                                    .unwrap_or_default()
                                                    .as_millis() as u64,
                                            ),
                                            retry_count: 0,
                                        };
                                        update_flag.store(true, Ordering::Relaxed);
                                        retry_count = 0;
                                    }
                                    Err(e) => {
                                        let preview: String = text.chars().take(200).collect();
                                        let msg = format!("JSON解析失败: {} (响应前200字符: {})", e, preview);
                                        *status.lock().unwrap() = PollStatus::Error {
                                            message: msg,
                                            retry_count,
                                        };
                                        update_flag.store(true, Ordering::Relaxed);
                                        retry_count += 1;
                                    }
                                }
                            }
                            Err(e) => {
                                let msg = format!("读取响应失败: {}", e);
                                *status.lock().unwrap() = PollStatus::Error {
                                    message: msg,
                                    retry_count,
                                };
                                update_flag.store(true, Ordering::Relaxed);
                                retry_count += 1;
                            }
                        }
                    }
                    Err(e) => {
                        if !running.load(Ordering::SeqCst) {
                            break;
                        }
                        let msg = if e.is_timeout() {
                            "连接超时——请检查目标机器是否在线".to_string()
                        } else if e.is_connect() {
                            format!("无法连接到 {}:{} - 请检查网络和目标是否运行 LHM", ip, port)
                        } else {
                            format!("网络错误: {}", e)
                        };
                        *status.lock().unwrap() = PollStatus::Error {
                            message: msg,
                            retry_count,
                        };
                        update_flag.store(true, Ordering::Relaxed);
                        retry_count += 1;
                    }
                }

                let backoff = if retry_count == 0 {
                    interval
                } else {
                    let exp = 2u32.pow(std::cmp::min(retry_count - 1, 4));
                    let max_backoff = Duration::from_secs(60);
                    std::cmp::min(interval * exp as u32, max_backoff)
                };

                tokio::time::sleep(backoff).await;
            }
        });

        Ok(())
    }

    pub async fn stop(&mut self) {
        self.running.store(false, Ordering::SeqCst);
        *self.status.lock().unwrap() = PollStatus::Idle;
        self.update_flag.store(true, Ordering::Relaxed);
    }

    pub fn data(&self) -> Option<ParsedData> {
        self.data.lock().unwrap().clone()
    }

    pub fn status(&self) -> PollStatus {
        self.status.lock().unwrap().clone()
    }

    pub fn has_update(&self) -> bool {
        self.update_flag.swap(false, Ordering::Relaxed)
    }
}
