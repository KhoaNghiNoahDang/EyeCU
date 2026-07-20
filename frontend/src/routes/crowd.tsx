import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'

export const Route = createFileRoute('/crowd')({
  component: CrowdDashboard,
})

type CameraData = {
  camera_id: string;
  camera_name: string;
  count: number;
  alert: boolean;
  lastUpdate: number;
}

const INITIAL_CAMERAS: Record<string, CameraData> = {
  "cam_01": { camera_id: "cam_01", camera_name: "Sảnh chờ Khoa Nội tiết", count: 0, alert: false, lastUpdate: 0 },
  "cam_02": { camera_id: "cam_02", camera_name: "Sảnh chờ Khoa Tai mũi họng", count: 0, alert: false, lastUpdate: 0 },
  "cam_03": { camera_id: "cam_03", camera_name: "Sảnh chờ Khoa Tim mạch", count: 0, alert: false, lastUpdate: 0 },
  "cam_04": { camera_id: "cam_04", camera_name: "Sảnh chờ Khoa Nhi", count: 0, alert: false, lastUpdate: 0 },
};

export function CrowdDashboard() {
  const [cameras, setCameras] = useState<Record<string, CameraData>>(INITIAL_CAMERAS)
  const [status, setStatus] = useState('Connecting...')
  const imgRefs = useRef<Record<string, HTMLImageElement | null>>({})

  useEffect(() => {
    let ws: WebSocket;
    
    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/api/crowd/ws/live')

      ws.onopen = () => {
        setStatus('Connected to AI Engine')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.camera_id) {
            setCameras(prev => ({
              ...prev,
              [data.camera_id]: {
                camera_id: data.camera_id,
                camera_name: data.camera_name || "Camera",
                count: data.count || 0,
                alert: data.alert || false,
                lastUpdate: Date.now()
              }
            }))
            
            // Bypass React state for the heavy image to avoid lag
            if (data.image_base64 && imgRefs.current[data.camera_id]) {
              imgRefs.current[data.camera_id]!.src = data.image_base64
              // Hide the loading spinner DOM element once we have a frame
              const spinner = imgRefs.current[data.camera_id]!.nextElementSibling as HTMLElement;
              if (spinner) spinner.style.display = 'none';
            }
          }
        } catch (e) {
          console.error("Failed to parse telemetry", e)
        }
      }

      ws.onclose = () => {
        setStatus('Disconnected. Reconnecting...')
        setTimeout(connect, 3000)
      }
      
      ws.onerror = (err) => {
        console.error('WebSocket Error', err);
        ws.close();
      }
    }

    connect()

    return () => {
      if (ws) ws.close()
    }
  }, [])

  const camList = Object.values(cameras)
  
  // Dynamic responsive grid logic
  const gridClass = camList.length === 1 
    ? 'grid-cols-1 md:max-w-4xl md:mx-auto' 
    : camList.length === 2 
      ? 'grid-cols-1 lg:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Hệ thống Giám sát Đa Không Gian
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Tổng quan Mật độ & AI Phân tích Đám đông</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${status.includes('Connected') ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-600 font-medium">{status}</span>
          </div>
        </div>

        {/* Camera Grid */}
          <div className={`grid gap-6 ${gridClass}`}>
            {camList.map((cam) => (
              <div 
                key={cam.camera_id}
                className={`flex flex-col rounded-2xl overflow-hidden border transition-all duration-500 ${
                  cam.alert ? 'border-red-300 bg-red-50/50 shadow-md shadow-red-100' : 'border-slate-200 bg-white shadow-sm hover:shadow-md'
                }`}
              >
                {/* Camera Header */}
                <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1 opacity-70">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                    </div>
                    <span className="font-semibold text-slate-700 tracking-wide">{cam.camera_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${cam.alert ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-700'}`}>
                      {cam.alert ? 'Quá tải' : 'Bình thường'}
                    </span>
                  </div>
                </div>

                {/* Video Feed */}
                <div className="relative aspect-video bg-slate-100 flex items-center justify-center group overflow-hidden border-b border-slate-100">
                  <img 
                    ref={(el) => { imgRefs.current[cam.camera_id] = el }}
                    className="w-full h-full object-contain relative z-10"
                    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-slate-400 z-0">
                    <svg className="w-6 h-6 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium text-slate-500">Loading AI Stream...</span>
                  </div>
                  
                  {/* Overlay Stats */}
                  <div className="absolute bottom-3 right-3 z-20 flex items-center space-x-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <svg className={`w-5 h-5 ${cam.alert ? 'text-red-500' : 'text-cyan-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="flex items-baseline space-x-1.5">
                      <span className={`text-2xl font-black ${cam.alert ? 'text-red-600' : 'text-slate-800'}`}>{cam.count}</span>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">người</span>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                {cam.alert && (
                  <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs text-red-700 font-medium leading-relaxed">
                        Phát hiện quá tải khu vực {cam.camera_name}. Yêu cầu điều hướng bệnh nhân để đảm bảo chất lượng dịch vụ.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

      </div>
    </div>
  )
}
