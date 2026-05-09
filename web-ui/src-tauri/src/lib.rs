use tauri::Manager;

#[derive(serde::Serialize)]
struct DesktopContext {
    platform: String,
    app_version: String,
    jcode_path: Option<String>,
    gateway_url: String,
}

#[tauri::command]
fn get_platform() -> String {
    #[cfg(target_os = "windows")]
    return "windows".to_string();
    #[cfg(target_os = "macos")]
    return "macos".to_string();
    #[cfg(target_os = "linux")]
    return "linux".to_string();
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    return "unknown".to_string();
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn get_desktop_context() -> DesktopContext {
    DesktopContext {
        platform: get_platform(),
        app_version: get_app_version(),
        jcode_path: find_jcode_binary(),
        gateway_url: "http://127.0.0.1:7643".to_string(),
    }
}

fn find_jcode_binary() -> Option<String> {
    if let Ok(current_exe) = std::env::current_exe() {
        if current_exe
            .file_stem()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.eq_ignore_ascii_case("jcode"))
        {
            return Some(current_exe.display().to_string());
        }
    }

    let exe_name = if cfg!(windows) { "jcode.exe" } else { "jcode" };
    let path_var = std::env::var_os("PATH")?;
    std::env::split_paths(&path_var)
        .map(|dir| dir.join(exe_name))
        .find(|candidate| candidate.is_file())
        .map(|candidate| candidate.display().to_string())
}

#[tauri::command]
async fn set_window_title(app: tauri::AppHandle, title: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_title(&title).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn minimize_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn maximize_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_maximized().unwrap_or(false) {
            window.unmaximize().map_err(|e| e.to_string())?;
        } else {
            window.maximize().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn close_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn is_maximized(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        window.is_maximized().map_err(|e| e.to_string())
    } else {
        Ok(false)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            get_platform,
            get_app_version,
            get_desktop_context,
            set_window_title,
            minimize_window,
            maximize_window,
            close_window,
            is_maximized,
        ])
        .setup(|app| {
            log::info!("jcode Web UI starting...");

            // Log window info
            if let Some(window) = app.get_webview_window("main") {
                log::info!("Main window created: {:?}", window.title());

                // Set up window event handling for maximize state
                let _window_clone = window.clone();
                window.on_window_event(move |event| {
                    match event {
                        tauri::WindowEvent::Resized(_) => {
                            // Could emit event to frontend here if needed
                        }
                        tauri::WindowEvent::CloseRequested { .. } => {
                            log::info!("Window close requested");
                        }
                        _ => {}
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
