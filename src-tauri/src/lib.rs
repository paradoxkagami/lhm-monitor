use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, RunEvent,
};
use tokio::sync::Mutex;

mod lhm;
mod poller;
mod store;

use poller::Poller;
use store::AppStore;

pub struct AppState {
    pub poller: Arc<Mutex<Poller>>,
    pub store: Arc<Mutex<AppStore>>,
}

#[tauri::command]
async fn connect(
    state: tauri::State<'_, AppState>,
    ip: String,
    port: u16,
    interval_secs: u64,
) -> Result<(), String> {
    let mut poller = state.poller.lock().await;
    poller.start(ip, port, interval_secs).await
}

#[tauri::command]
async fn disconnect(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut poller = state.poller.lock().await;
    poller.stop().await;
    Ok(())
}

#[tauri::command]
async fn get_data(state: tauri::State<'_, AppState>) -> Result<Option<lhm::ParsedData>, String> {
    let poller = state.poller.lock().await;
    Ok(poller.data())
}

#[tauri::command]
async fn get_status(state: tauri::State<'_, AppState>) -> Result<lhm::PollStatus, String> {
    let poller = state.poller.lock().await;
    Ok(poller.status().clone())
}

#[tauri::command]
async fn load_settings(state: tauri::State<'_, AppState>) -> Result<lhm::AppSettings, String> {
    let store = state.store.lock().await;
    Ok(store.load_settings())
}

#[tauri::command]
async fn save_settings(
    state: tauri::State<'_, AppState>,
    settings: lhm::AppSettings,
) -> Result<(), String> {
    let store = state.store.lock().await;
    store.save_settings(&settings)
}

#[tauri::command]
async fn load_window_bounds(state: tauri::State<'_, AppState>) -> Result<lhm::WindowBounds, String> {
    let store = state.store.lock().await;
    Ok(store.load_window_bounds())
}

#[tauri::command]
async fn save_window_bounds(
    state: tauri::State<'_, AppState>,
    bounds: lhm::WindowBounds,
) -> Result<(), String> {
    let store = state.store.lock().await;
    store.save_window_bounds(&bounds)
}

pub fn run() {
    let store = Arc::new(Mutex::new(AppStore::new()));
    let poller = Arc::new(Mutex::new(Poller::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            poller,
            store,
        })
        .invoke_handler(tauri::generate_handler![
            connect,
            disconnect,
            get_data,
            get_status,
            load_settings,
            save_settings,
            load_window_bounds,
            save_window_bounds,
        ])
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "显示监控窗口", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "隐藏监控窗口", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "退出程序", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().cloned().unwrap())
                .menu(&menu)
                .tooltip("LHM Monitor")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_skip_taskbar(false);
                            }
                        }
                        "hide" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.hide();
                                let _ = w.set_skip_taskbar(true);
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_skip_taskbar(false);
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            let poller_handle = app.state::<AppState>().poller.clone();
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(std::time::Duration::from_millis(500));
                loop {
                    interval.tick().await;
                    let poller = poller_handle.lock().await;
                    if poller.has_update() {
                        let status = poller.status().clone();
                        let _ = app_handle.emit("poll-status", &status);
                    }
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let RunEvent::WindowEvent { event, label, .. } = event {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    if label == "main" {
                        api.prevent_close();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.hide();
                            let _ = w.set_skip_taskbar(true);
                        }
                    }
                }
            }
        });
}
