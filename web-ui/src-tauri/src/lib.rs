use tauri::Manager;

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
