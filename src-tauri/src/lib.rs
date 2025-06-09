use std::sync::Mutex;
use tauri::async_runtime::spawn;
use tauri::{AppHandle, Manager, State};
use tokio::time::{sleep, Duration};

struct SetupState {
    health_check_complete: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(SetupState {
            health_check_complete: false,
        }))
        .invoke_handler(tauri::generate_handler![start_health_check])
        .setup(|app| {
            spawn(health_check_monitor(app.handle().clone()));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn start_health_check(app: AppHandle) -> Result<(), String> {
    spawn(health_check_monitor(app));
    Ok(())
}

#[tauri::command]
async fn set_complete(app: AppHandle, state: State<'_, Mutex<SetupState>>) -> Result<(), ()> {
    let mut state_lock = state.lock().unwrap();
    state_lock.health_check_complete = true;

    if let Some(splash_window) = app.get_webview_window("splashscreen") {
        let _ = splash_window.close();
    }
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.show();
    }

    Ok(())
}

// Health check monitoring function
async fn health_check_monitor(app: AppHandle) -> Result<(), ()> {
    println!("Starting health check monitoring...");

    loop {
        match perform_health_check().await {
            Ok(true) => {
                println!("Health check successful! Service is ready.");
                set_complete(app.clone(), app.state::<Mutex<SetupState>>()).await?;
                break;
            }
            Ok(false) => {
                println!("Health check failed, retrying in 2 seconds...");
            }
            Err(e) => {
                println!("Health check error: {}, retrying in 2 seconds...", e);
            }
        }

        sleep(Duration::from_secs(2)).await;
    }

    Ok(())
}

// Perform the actual health check
async fn perform_health_check() -> Result<bool, String> {
    use tauri_plugin_http::reqwest;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    match client.get("http://localhost:31347/v1/healthz").send().await {
        Ok(response) => {
            let status = response.status();
            println!("Health check response status: {}", status);
            Ok(status.as_u16() == 200)
        }
        Err(e) => Err(format!("HTTP request failed: {}", e)),
    }
}
