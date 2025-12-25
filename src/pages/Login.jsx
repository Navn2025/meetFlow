import {useForm} from 'react-hook-form';
import {useDispatch} from 'react-redux';
import {loginUser} from '../store/auth.slice';
import {Link, useNavigate} from 'react-router-dom';
import {VideoIcon} from '../components/icons/Icons.jsx';

const Login=() =>
{
    const dispatch=useDispatch();
    const navigate=useNavigate();

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    }=useForm();

    const submitHandler=async (data) =>
    {
        try
        {
            const res=await dispatch(loginUser(data)).unwrap();
            console.log("Login successful:", res.user);
            navigate('/streaming');
        } catch (err)
        {
            console.error("Login failed:", err);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header */}
            <header className="border-b border-neutral-800">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
                    <Link to="/" className="flex items-center gap-2 text-white w-fit">
                        <VideoIcon className="w-7 h-7" />
                        <span className="text-xl font-bold tracking-tight">MeetFlow</span>
                    </Link>
                </div>
            </header>

            {/* Login Form */}
            <div className="flex-1 flex items-center justify-center px-3 sm:px-6 py-10 sm:py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
                        <p className="text-neutral-400">Sign in to continue to your meetings</p>
                    </div>

                    <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Email
                            </label>
                            <input
                                {...register("email", {required: "Email is required"})}
                                type="email"
                                placeholder="you@example.com"
                                className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white transition placeholder-neutral-500"
                            />
                            {errors?.email&&(
                                <span className="text-red-400 mt-1.5 text-sm block">
                                    {errors.email.message}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Password
                            </label>
                            <input
                                {...register("password", {required: "Password is required"})}
                                type="password"
                                placeholder="Enter your password"
                                className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white transition placeholder-neutral-500"
                            />
                            {errors?.password&&(
                                <span className="text-red-400 mt-1.5 text-sm block">
                                    {errors.password.message}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {isSubmitting? 'Signing in...':'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-neutral-400 mt-6 sm:mt-8">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-white hover:underline font-medium">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;