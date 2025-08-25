import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { AppDispatch, RootState } from '../../store'
import { loginUser } from '../../store/slices/authSlice'
import { toast } from 'sonner'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { loading, error, user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { pending } = useSelector((state: RootState) => state.pending)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      const result = await dispatch(loginUser(formData))
      
      // Check if login was successful by examining the result
      // The result is a Redux action object with { type, payload, meta }
      const loginResult = result as any;
      console.log('Login result:', loginResult);
      
      // Check if the action was fulfilled (successful) or rejected (failed)
      if (loginResult.type === 'auth/loginUser/fulfilled') {
        // Login was successful - extract the API response data
        const apiResponse = loginResult?.payload;
        console.log('API response from payload:', apiResponse);
        
        // Check if the API response contains user and tokens data
        if (apiResponse?.data?.user && apiResponse?.data?.tokens) {
          // Login successful - show success message and navigate
          toast.success('Login successful!')
          console.log('Login successful, navigating to dashboard for user type:', apiResponse.data.user.user_type);
          
          // Navigate to appropriate dashboard based on user type
          const userType = apiResponse.data.user.user_type;
          console.log('Attempting to navigate to dashboard for user type:', userType);
          
          switch (userType) {
            case 'player':
              console.log('Navigating to player dashboard');
              navigate('/player/dashboard')
              break
            case 'coach':
              console.log('Navigating to coach dashboard');
              navigate('/coach/dashboard')
              break
            case 'club':
              console.log('Navigating to club dashboard');
              navigate('/club/dashboard')
              break
            case 'partner':
              console.log('Navigating to partner dashboard');
              navigate('/partner/dashboard')
              break
            case 'state':
              console.log('Navigating to state dashboard');
              navigate('/state/dashboard')
              break
            case 'admin':
              console.log('Navigating to admin dashboard');
              navigate('/admin/dashboard')
              break
            default:
              console.log('Unknown user type, defaulting to player dashboard');
              navigate('/player/dashboard')
          }
        } else {
          // Login failed - show error and stay on login page
          toast.error('Login failed - Invalid response from server')
          console.error('Login failed - Invalid response structure:', apiResponse)
        }
      } else if (loginResult.type === 'auth/loginUser/rejected') {
        // Login was rejected - show error message
        const errorMessage = loginResult?.payload || 'Login failed';
        toast.error(errorMessage);
        console.error('Login failed:', errorMessage);
      }
    } catch (err) {
      // This catch block should not be reached with proper async thunk handling
      // But keeping it as a safety net
      toast.error('Login failed - Unexpected error')
      console.error('Login error:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Check if any action is pending
  const isAnyActionPending = pending

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div>
        <div className="animate-on-scroll w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-6 space-y-1">
            <div>
              <h1 className="animate-on-scroll text-2xl font-bold text-center text-gray-900">
                Sign in to your account
              </h1>
            </div>
            <div>
              <p className="animate-on-scroll text-center text-gray-600">
                Enter your credentials to access your account
              </p>
            </div>
          </div>
          <div className="p-6">
            <form 
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="email" className="animate-on-scroll block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent animate-on-scroll"
                  disabled={isAnyActionPending}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="animate-on-scroll block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent animate-on-scroll"
                  disabled={isAnyActionPending}
                />
              </div>
              <div>
                <button 
                  type="submit" 
                  className="animate-on-scroll w-full h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={loading || isAnyActionPending}
                >
                  {loading || isAnyActionPending ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
            <div className="mt-4 text-center">
              <p className="animate-on-scroll text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/register/select-type" 
                  className="text-blue-600 hover:text-blue-500 hover:scale-105 transition-transform duration-300 animate-on-scroll"
                  style={{ pointerEvents: isAnyActionPending ? 'none' : 'auto' }}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 