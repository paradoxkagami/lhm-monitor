use crate::lhm::{AppSettings, WindowBounds};

pub struct AppStore {
    dir: std::path::PathBuf,
}

impl AppStore {
    pub fn new() -> Self {
        let dir = dirs_data_path();
        std::fs::create_dir_all(&dir).ok();
        Self { dir }
    }

    pub async fn load_settings(&self) -> AppSettings {
        let path = self.dir.join("settings.json");
        tokio::fs::read_to_string(&path)
            .await
            .ok()
            .and_then(|raw| serde_json::from_str(&raw).ok())
            .unwrap_or_default()
    }

    pub async fn save_settings(&self, settings: &AppSettings) -> Result<(), String> {
        let path = self.dir.join("settings.json");
        let raw = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
        tokio::fs::write(path, raw).await.map_err(|e| e.to_string())
    }

    pub async fn load_window_bounds(&self) -> WindowBounds {
        let path = self.dir.join("window_bounds.json");
        tokio::fs::read_to_string(&path)
            .await
            .ok()
            .and_then(|raw| serde_json::from_str(&raw).ok())
            .unwrap_or_default()
    }

    pub async fn save_window_bounds(&self, bounds: &WindowBounds) -> Result<(), String> {
        let path = self.dir.join("window_bounds.json");
        let raw = serde_json::to_string_pretty(bounds).map_err(|e| e.to_string())?;
        tokio::fs::write(path, raw).await.map_err(|e| e.to_string())
    }
}

fn dirs_data_path() -> std::path::PathBuf {
    let base = dirs_data_local_path();
    base.join("lhm-monitor")
}

fn dirs_data_local_path() -> std::path::PathBuf {
    std::env::var("LOCALAPPDATA")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
}