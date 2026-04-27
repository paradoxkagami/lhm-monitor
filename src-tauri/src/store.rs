use crate::lhm::{AppSettings, WindowBounds};
use std::fs;
use std::path::PathBuf;

pub struct AppStore {
    dir: PathBuf,
}

impl AppStore {
    pub fn new() -> Self {
        let dir = dirs_data_path();
        fs::create_dir_all(&dir).ok();
        Self { dir }
    }

    pub fn load_settings(&self) -> AppSettings {
        let path = self.dir.join("settings.json");
        match fs::read_to_string(&path) {
            Ok(raw) => serde_json::from_str(&raw).unwrap_or_default(),
            Err(_) => AppSettings::default(),
        }
    }

    pub fn save_settings(&self, settings: &AppSettings) -> Result<(), String> {
        let path = self.dir.join("settings.json");
        let raw = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
        fs::write(path, raw).map_err(|e| e.to_string())
    }

    pub fn load_window_bounds(&self) -> WindowBounds {
        let path = self.dir.join("window_bounds.json");
        match fs::read_to_string(&path) {
            Ok(raw) => serde_json::from_str(&raw).unwrap_or_default(),
            Err(_) => WindowBounds::default(),
        }
    }

    pub fn save_window_bounds(&self, bounds: &WindowBounds) -> Result<(), String> {
        let path = self.dir.join("window_bounds.json");
        let raw = serde_json::to_string_pretty(bounds).map_err(|e| e.to_string())?;
        fs::write(path, raw).map_err(|e| e.to_string())
    }
}

fn dirs_data_path() -> PathBuf {
    let base = dirs_data_local_path();
    base.join("lhm-monitor")
}

fn dirs_data_local_path() -> PathBuf {
    std::env::var("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
}
