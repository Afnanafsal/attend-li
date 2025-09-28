'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Camera, Users, CheckCircle, AlertCircle, XCircle, Loader, UserPlus, Upload, Clock, BarChart3, Brain, Zap } from 'lucide-react'

interface RecognitionResult {
  status: string
  user?: string
  attendance?: string
  message?: string
  confidence?: number
}

interface ModelStatus {
  model_trained: boolean
  total_users: number
  training_in_progress: boolean
  last_trained?: string
  min_users_required: number
}

interface AttendanceRecord {
  username: string
  timestamp: string
  confidence: number
  date: string
}

interface User {
  username: string
  registered_date: string
}

function UserRegistration({ onUserRegistered }: { onUserRegistered: () => void }) {
  const [username, setUsername] = useState('')
  const [isUsingWebcam, setIsUsingWebcam] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationResult, setRegistrationResult] = useState<{ status: string; message: string } | null>(null)
  const [isCaptureMode, setIsCaptureMode] = useState(false)
  
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return

    const imageSrc = webcamRef.current.getScreenshot()
    if (imageSrc) {
      // Convert base64 to blob
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `${username}_capture.jpg`, { type: 'image/jpeg' })
          setSelectedFile(file)
          setIsCaptureMode(false)
        })
    }
  }, [username])

  const registerUser = async () => {
    if (!username.trim() || !selectedFile) {
      setRegistrationResult({ status: 'error', message: 'Please enter username and capture/select an image' })
      return
    }

    setIsRegistering(true)
    setRegistrationResult(null)

    try {
      const formData = new FormData()
      formData.append('username', username.trim())
      formData.append('file', selectedFile)

      const response = await fetch('http://localhost:8000/register_user', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setRegistrationResult({ status: 'success', message: result.message })
        setUsername('')
        setSelectedFile(null)
        setIsCaptureMode(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        onUserRegistered()
      } else {
        setRegistrationResult({ status: 'error', message: result.detail || 'Registration failed' })
      }
    } catch (error) {
      setRegistrationResult({ status: 'error', message: 'Failed to connect to server' })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
          <UserPlus className="text-white" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Register New User</h2>
          <p className="text-gray-600 text-sm">Add a new person to the AI recognition system</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Username Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <Users className="inline mr-2" size={16} />
            Full Name
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
            placeholder="Enter full name (e.g., John Doe)"
            disabled={isRegistering}
          />
        </div>

        {/* Photo Input Method Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <Camera className="inline mr-2" size={16} />
            Choose Photo Method
          </label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {setIsUsingWebcam(true); setSelectedFile(null); setIsCaptureMode(false)}}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isUsingWebcam 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg' 
                  : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Camera size={24} className="mx-auto mb-2" />
              <span className="text-sm font-medium block">Use Camera</span>
              <span className="text-xs text-gray-500">Live capture</span>
            </button>
            <button
              onClick={() => {setIsUsingWebcam(false); setIsCaptureMode(false)}}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                !isUsingWebcam 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg' 
                  : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Upload size={24} className="mx-auto mb-2" />
              <span className="text-sm font-medium block">Upload File</span>
              <span className="text-xs text-gray-500">From device</span>
            </button>
          </div>
        </div>

        {/* Photo Input */}
        {isUsingWebcam ? (
          <div className="space-y-4">
            {isCaptureMode ? (
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-xl border-2 border-gray-300 shadow-lg"
                  videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                />
                <div className="absolute inset-0 border-4 border-dashed border-blue-400 rounded-xl pointer-events-none opacity-60"></div>
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold shadow-lg"
                  >
                    <Camera size={20} />
                    <span>Capture Photo</span>
                  </button>
                  <button
                    onClick={() => setIsCaptureMode(false)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCaptureMode(true)}
                disabled={isRegistering}
                className="w-full py-16 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Camera size={64} className="mx-auto mb-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <p className="text-gray-700 font-semibold text-lg mb-2">Click to open camera</p>
                <p className="text-sm text-gray-500">Make sure your face is clearly visible and well-lit</p>
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
              disabled={isRegistering}
            />
          </div>
        )}

        {/* Photo Preview */}
        {selectedFile && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="font-semibold text-green-800">Photo Ready!</p>
                <p className="text-sm text-green-700">{selectedFile.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Register Button */}
        <button
          onClick={registerUser}
          disabled={isRegistering || !username.trim() || !selectedFile}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
        >
          {isRegistering ? (
            <>
              <Loader className="animate-spin" size={24} />
              <span>Registering & Training AI...</span>
            </>
          ) : (
            <>
              <Brain size={24} />
              <span>Register & Train AI Model</span>
            </>
          )}
        </button>

        {/* Registration Result */}
        {registrationResult && (
          <div className={`p-6 rounded-xl border-l-4 ${
            registrationResult.status === 'success' 
              ? 'bg-green-50 border-green-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center space-x-3">
              {registrationResult.status === 'success' ? (
                <CheckCircle className="text-green-500" size={28} />
              ) : (
                <XCircle className="text-red-500" size={28} />
              )}
              <div>
                <p className={`font-semibold text-lg ${
                  registrationResult.status === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {registrationResult.message}
                </p>
                {registrationResult.status === 'success' && (
                  <div className="mt-2 flex items-center space-x-2 text-green-700">
                    <Zap size={16} />
                    <p className="text-sm font-medium">AI model is retraining automatically in the background</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FaceRecognition() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  
  const webcamRef = useRef<Webcam>(null)

  const fetchModelStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/model_status')
      const status = await response.json()
      setModelStatus(status)
    } catch (error) {
      console.error('Failed to fetch model status:', error)
    }
  }, [])

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/attendance/today')
      const data = await response.json()
      setTodayAttendance(data.attendance || [])
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    }
  }, [])

  useEffect(() => {
    fetchModelStatus()
    fetchTodayAttendance()
    const interval = setInterval(() => {
      fetchModelStatus()
      fetchTodayAttendance()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchModelStatus, fetchTodayAttendance])

  const captureAndRecognize = useCallback(async () => {
    if (!webcamRef.current) return

    setIsCapturing(true)
    setResult(null)

    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) {
        throw new Error('Failed to capture image')
      }

      const response = await fetch(imageSrc)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append('file', blob, 'capture.jpg')

      const recognitionResponse = await fetch('http://localhost:8000/recognize_face', {
        method: 'POST',
        body: formData,
      })

      const recognitionResult = await recognitionResponse.json()
      setResult(recognitionResult)
      
      // Refresh data after recognition
      fetchModelStatus()
      fetchTodayAttendance()
    } catch (error) {
      setResult({ status: 'error', message: 'Failed to recognize face. Please try again.' })
    } finally {
      setIsCapturing(false)
    }
  }, [fetchModelStatus, fetchTodayAttendance])

  return (
    <div className="space-y-6">
      {/* Main Recognition Card */}
      <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
              <Camera className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Face Recognition</h2>
              <p className="text-gray-600 text-sm">Position your face in the camera and capture</p>
            </div>
          </div>
          {modelStatus && (
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-2 rounded-full text-sm font-semibold ${
                modelStatus.model_trained 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {modelStatus.model_trained ? '✓ Model Ready' : '⚠ Not Trained'}
              </div>
              {modelStatus.training_in_progress && (
                <div className="px-3 py-2 rounded-full text-sm bg-blue-100 text-blue-800 flex items-center space-x-2">
                  <Loader className="animate-spin" size={16} />
                  <span>Training AI</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full rounded-xl shadow-lg border-2 border-gray-200"
              videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
            />
            <div className="absolute inset-0 border-4 border-dashed border-green-400 rounded-xl pointer-events-none opacity-40"></div>
          </div>
          
          <button
            onClick={captureAndRecognize}
            disabled={isCapturing || !modelStatus?.model_trained}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
          >
            {isCapturing ? (
              <>
                <Loader className="animate-spin" size={24} />
                <span>Recognizing Face...</span>
              </>
            ) : (
              <>
                <Camera size={24} />
                <span>Capture & Mark Attendance</span>
              </>
            )}
          </button>

          {!modelStatus?.model_trained && (
            <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <AlertCircle className="text-yellow-600" size={24} />
                <div>
                  <p className="font-semibold text-yellow-800">AI Model Not Ready</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please register at least {modelStatus?.min_users_required || 2} users to train the AI model
                  </p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className={`p-6 rounded-xl border-2 ${
              result.status === 'success' ? 'bg-green-50 border-green-300' :
              result.status === 'already_marked' ? 'bg-yellow-50 border-yellow-300' :
              result.status === 'unknown' ? 'bg-orange-50 border-orange-300' :
              'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {result.status === 'success' && <CheckCircle className="text-green-600" size={32} />}
                  {result.status === 'unknown' && <AlertCircle className="text-orange-600" size={32} />}
                  {result.status === 'error' && <XCircle className="text-red-600" size={32} />}
                  {result.status === 'already_marked' && <Clock className="text-yellow-600" size={32} />}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-lg ${
                    result.status === 'success' ? 'text-green-800' :
                    result.status === 'already_marked' ? 'text-yellow-800' :
                    result.status === 'unknown' ? 'text-orange-800' :
                    'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                  {result.user && (
                    <p className="text-sm opacity-75 mt-1">User: {result.user}</p>
                  )}
                  {result.confidence && (
                    <p className="text-sm opacity-75 mt-1">
                      Confidence: {(result.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Today's Attendance Summary */}
      {modelStatus?.total_users > 0 && (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Today's Attendance</h3>
          </div>
          
          {todayAttendance.length > 0 ? (
            <div className="space-y-2">
              {todayAttendance.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="font-medium capitalize">{record.username.replace('_', ' ')}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No attendance marked today</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'recognize' | 'register'>('register')
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null)

  const fetchModelStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/model_status')
      const status = await response.json()
      setModelStatus(status)
      
      // Auto-switch to recognition tab if model is ready and we're on register tab
      if (status.model_trained && activeTab === 'register' && status.total_users >= 2) {
        setTimeout(() => setActiveTab('recognize'), 1000)
      }
    } catch (error) {
      console.error('Failed to fetch model status:', error)
    }
  }, [activeTab])

  useEffect(() => {
    fetchModelStatus()
    const interval = setInterval(fetchModelStatus, 3000)
    return () => clearInterval(interval)
  }, [fetchModelStatus])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Brain className="text-white" size={36} />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Attend-II
            </h1>
          </div>
          <p className="text-xl text-gray-600 font-medium">AI-Powered Face Recognition Attendance System</p>
          
          {/* Status Dashboard */}
          {modelStatus && (
            <div className="mt-6 flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Users size={20} className="text-blue-500" />
                    <span className="font-semibold text-gray-700">
                      {modelStatus.total_users} Users
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                    modelStatus.model_trained 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      modelStatus.model_trained ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-semibold">
                      {modelStatus.model_trained ? 'AI Ready' : 'AI Not Trained'}
                    </span>
                  </div>
                  {modelStatus.training_in_progress && (
                    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                      <Loader className="animate-spin" size={16} />
                      <span className="text-sm font-semibold">Training</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-2 border border-gray-200">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-8 py-3 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'register' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Register User
            </button>
            <button
              onClick={() => setActiveTab('recognize')}
              className={`px-8 py-3 rounded-xl transition-all duration-200 font-semibold ${
                activeTab === 'recognize' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Face Recognition
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'register' ? (
            <UserRegistration onUserRegistered={fetchModelStatus} />
          ) : (
            <FaceRecognition />
          )}
        </div>
      </div>
    </div>
  )
}