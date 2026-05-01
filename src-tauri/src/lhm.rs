use serde::{Deserialize, Deserializer, Serialize};

fn parse_flex_f64(s: &str) -> Option<f64> {
    let s = s.trim();
    if s.is_empty() {
        return None;
    }
    if let Ok(v) = s.parse::<f64>() {
        return Some(v);
    }
    let cleaned: String = s
        .chars()
        .take_while(|c| c.is_ascii_digit() || *c == '.' || *c == '-' || *c == '+')
        .collect();
    if cleaned.is_empty() {
        return None;
    }
    cleaned.parse::<f64>().ok()
}

fn deserialize_opt_f64<'de, D>(deserializer: D) -> Result<Option<f64>, D::Error>
where
    D: Deserializer<'de>,
{
    let val = serde_json::Value::deserialize(deserializer)?;
    match val {
        serde_json::Value::Null => Ok(None),
        serde_json::Value::Number(n) => Ok(n.as_f64()),
        serde_json::Value::String(s) => Ok(parse_flex_f64(&s)),
        _ => Ok(None),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct LHMNode {
    pub Text: String,
    pub Children: Vec<LHMNode>,
    #[serde(deserialize_with = "deserialize_opt_f64", default)]
    pub Value: Option<f64>,
    #[serde(deserialize_with = "deserialize_opt_f64", default)]
    pub Min: Option<f64>,
    #[serde(deserialize_with = "deserialize_opt_f64", default)]
    pub Max: Option<f64>,
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct LHMResponse {
    pub Children: Vec<LHMNode>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum SensorCategory {
    Load,
    Temperature,
    Power,
    Clock,
    Fan,
    Data,
    Voltage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedSensor {
    pub name: String,
    pub value: f64,
    pub min: f64,
    pub max: f64,
    pub category: SensorCategory,
    pub unit: String,
    pub load_percent: Option<f64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum DeviceType {
    CPU,
    GPU,
    Motherboard,
    Memory,
    Storage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceColor {
    pub hue: i32,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedDevice {
    #[serde(rename = "type")]
    pub device_type: DeviceType,
    pub name: String,
    pub sensors: Vec<ParsedSensor>,
    pub color: DeviceColor,
    pub load: Option<f64>,
    pub max_temp: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedData {
    pub pc_name: String,
    pub devices: Vec<ParsedDevice>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode {
    Dark,
    Light,
    Auto,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ColumnMode {
    Auto,
    #[serde(rename = "1")]
    One,
    #[serde(rename = "2")]
    Two,
    #[serde(rename = "3")]
    Three,
    #[serde(rename = "4")]
    Four,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub ip: String,
    pub port: u16,
    pub interval: u64,
    pub theme: ThemeMode,
    pub font_family: String,
    pub font_size: u32,
    pub dpi_scale: u32,
    pub column_mode: ColumnMode,
    #[serde(default)]
    pub hidden_devices: Vec<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            ip: String::new(),
            port: 8085,
            interval: 3,
            theme: ThemeMode::Dark,
            font_family: "Segoe UI Variable, Microsoft YaHei, PingFang SC, sans-serif"
                .to_string(),
            font_size: 13,
            dpi_scale: 100,
            column_mode: ColumnMode::Auto,
            hidden_devices: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowBounds {
    pub width: f64,
    pub height: f64,
    pub x: i32,
    pub y: i32,
}

impl Default for WindowBounds {
    fn default() -> Self {
        Self {
            width: 420.0,
            height: 660.0,
            x: 1480,
            y: 30,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum PollStatus {
    Idle,
    Connecting,
    Polling { latency_ms: u64, last_update: Option<u64>, retry_count: u32 },
    Error { message: String, retry_count: u32 },
}

impl Default for PollStatus {
    fn default() -> Self {
        Self::Idle
    }
}

fn identify_device_type(name: &str) -> DeviceType {
    let n = name.to_lowercase();
    if ["cpu", "processor", "intel", "amd", "ryzen"].iter().any(|p| n.contains(p)) {
        return DeviceType::CPU;
    }
    if ["gpu", "graphics", "nvidia", "radeon", "arc", "video"].iter().any(|p| n.contains(p)) {
        return DeviceType::GPU;
    }
    if ["memory", "ram", "dimm"].iter().any(|p| n.contains(p)) {
        return DeviceType::Memory;
    }
    if ["drive", "ssd", "hdd", "nvme", "sata", "disk", "storage"].iter().any(|p| n.contains(p)) {
        return DeviceType::Storage;
    }
    if ["motherboard", "mainboard", "board", "super i/o", "nct"].iter().any(|p| n.contains(p)) {
        return DeviceType::Motherboard;
    }
    DeviceType::Motherboard
}

fn resolve_category(group_name: &str) -> Option<SensorCategory> {
    let n = group_name.to_lowercase();
    if n.contains("temperature") || n.contains("temp") {
        return Some(SensorCategory::Temperature);
    }
    if n.contains("load") || n.contains("usage") || n.contains("utilization") {
        return Some(SensorCategory::Load);
    }
    if n.contains("clock") || n.contains("frequency") {
        return Some(SensorCategory::Clock);
    }
    if n.contains("voltage") || n.contains("volt") {
        return Some(SensorCategory::Voltage);
    }
    if n.contains("fan") || n.contains("pump") {
        return Some(SensorCategory::Fan);
    }
    if n.contains("power") {
        return Some(SensorCategory::Power);
    }
    if n.contains("data") || n.contains("throughput") {
        return Some(SensorCategory::Data);
    }
    None
}

fn category_unit(category: &SensorCategory) -> String {
    match category {
        SensorCategory::Temperature => "°C".to_string(),
        SensorCategory::Load => "%".to_string(),
        SensorCategory::Power => "W".to_string(),
        SensorCategory::Clock => "MHz".to_string(),
        SensorCategory::Fan => "RPM".to_string(),
        SensorCategory::Voltage => "V".to_string(),
        SensorCategory::Data => String::new(),
    }
}

fn collect_sensors_from_group(node: &LHMNode, category: &SensorCategory, sensors: &mut Vec<ParsedSensor>) {
    if let Some(value) = node.Value {
        let unit = category_unit(category);
        let min = node.Min.unwrap_or(0.0);
        let max = node.Max.unwrap_or(0.0);

        let load_percent = if *category == SensorCategory::Load {
            if max <= 1.0 && value <= 1.0 {
                Some(value * 100.0)
            } else {
                Some(value)
            }
        } else {
            None
        };

        sensors.push(ParsedSensor {
            name: node.Text.clone(),
            value,
            min,
            max,
            category: *category,
            unit,
            load_percent,
        });
    }

    for child in &node.Children {
        collect_sensors_from_group(child, category, sensors);
    }
}

fn collect_all_sensors(node: &LHMNode, sensors: &mut Vec<ParsedSensor>) {
    if let Some(cat) = resolve_category(&node.Text) {
        for child in &node.Children {
            collect_sensors_from_group(child, &cat, sensors);
        }
    } else if node.Value.is_some() {
        if let Some(value) = node.Value {
            let min = node.Min.unwrap_or(0.0);
            let max = node.Max.unwrap_or(0.0);
            sensors.push(ParsedSensor {
                name: node.Text.clone(),
                value,
                min,
                max,
                category: SensorCategory::Data,
                unit: String::new(),
                load_percent: None,
            });
        }
    } else {
        for child in &node.Children {
            collect_all_sensors(child, sensors);
        }
    }
}

fn is_network_adapter(name: &str) -> bool {
    let n = name.to_lowercase();
    n.contains("本地连接")
        || n.contains("以太网")
        || n.contains("蓝牙网络")
        || n.contains("wi-fi")
        || n.contains("wifi")
        || n.contains("wireless")
        || n.contains("ethernet")
        || n.contains("network")
        || n.contains("qos")
        || n.contains("wfp")
        || n.contains("singbox")
        || n.contains("tun")
        || n.contains("vpn")
        || n.contains("vnic")
        || n.contains("hyper-v")
        || n.contains("virtual")
        || n.contains("bridge")
        || n.contains("filter")
        || n.contains("scheduler")
}

fn device_color(dt: &DeviceType) -> DeviceColor {
    match dt {
        DeviceType::CPU => DeviceColor { hue: 210, label: "CPU".into() },
        DeviceType::GPU => DeviceColor { hue: 270, label: "GPU".into() },
        DeviceType::Memory => DeviceColor { hue: 140, label: "RAM".into() },
        DeviceType::Storage => DeviceColor { hue: 30, label: "Disk".into() },
        DeviceType::Motherboard => DeviceColor { hue: 180, label: "MB".into() },
    }
}

pub fn parse_lhm_data(json: &LHMResponse) -> ParsedData {
    let root = match json.Children.first() {
        Some(r) => r,
        None => return ParsedData { pc_name: "Unknown".into(), devices: vec![] },
    };

    let pc_name = if root.Text.is_empty() {
        "Unknown PC".to_string()
    } else {
        root.Text.clone()
    };

    let devices: Vec<ParsedDevice> = root
        .Children
        .iter()
        .filter(|n| !n.Children.is_empty())
        .filter(|n| !is_network_adapter(&n.Text))
        .map(|node| {
            let device_type = identify_device_type(&node.Text);
            let mut sensors = Vec::new();
            collect_all_sensors(node, &mut sensors);

            let load = sensors
                .iter()
                .find(|s| s.category == SensorCategory::Load && s.load_percent.is_some())
                .and_then(|s| s.load_percent);

            let max_temp = sensors
                .iter()
                .filter(|s| s.category == SensorCategory::Temperature)
                .map(|s| s.value)
                .fold(0.0_f64, f64::max);

            ParsedDevice {
                device_type,
                name: node.Text.clone(),
                sensors,
                color: device_color(&device_type),
                load,
                max_temp: if max_temp > 0.0 { Some(max_temp) } else { None },
            }
        })
        .collect();

    ParsedData { pc_name, devices }
}
