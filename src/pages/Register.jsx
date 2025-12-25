import {useForm} from 'react-hook-form';
import {useDispatch} from 'react-redux';
import {registerUser} from '../store/auth.slice';
import {Link, useNavigate} from 'react-router-dom';
import {VideoIcon} from '../components/icons/Icons.jsx';

const Register=() =>
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
            const res=await dispatch(registerUser(data)).unwrap();
            console.log("Registration successful:", res.user);
            navigate('/login');
        } catch (err)
        {
            console.error("Registration failed:", err);
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

            {/* Register Form */}
            <div className="flex-1 flex items-center justify-center px-3 sm:px-6 py-10 sm:py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Create an account</h1>
                        <p className="text-neutral-400">Join MeetFlow and start hosting meetings</p>
                    </div>

                    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Full Name
                            </label>
                            <input
                                {...register("name", {required: "Name is required"})}
                                type="text"
                                placeholder="John Doe"
                                className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white transition placeholder-neutral-500"
                            />
                            {errors?.name&&(
                                <span className="text-red-400 mt-1.5 text-sm block">
                                    {errors.name.message}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Email
                            </label>
                            <input
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {value: /^\S+@\S+$/i, message: "Invalid email"}
                                })}
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
                                {...register("password", {
                                    required: "Password is required",
                                    minLength: {value: 6, message: "Minimum 6 characters"}
                                })}
                                type="password"
                                placeholder="Create a strong password"
                                className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white transition placeholder-neutral-500"
                            />
                            {errors?.password&&(
                                <span className="text-red-400 mt-1.5 text-sm block">
                                    {errors.password.message}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Preferred Language
                            </label>
                            <select
                                {...register("preferred_language", {required: "Language is required"})}
                                className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white transition"
                            >
                                <option value="" className="bg-neutral-900">Select Language</option>
                                <option value="en" className="bg-neutral-900">English</option>
                                <option value="es" className="bg-neutral-900">Spanish</option>
                                <option value="fr" className="bg-neutral-900">French</option>
                                <option value="de" className="bg-neutral-900">German</option>
                                <option value="hi" className="bg-neutral-900">Hindi</option>
                                <option value="zh" className="bg-neutral-900">Chinese</option>
                            </select>
                            {errors?.preferred_language&&(
                                <span className="text-red-400 mt-1.5 text-sm block">
                                    {errors.preferred_language.message}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {isSubmitting? 'Creating account...':'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-neutral-400 mt-6 sm:mt-8">
                        Already have an account?{' '}
                        <Link to="/login" className="text-white hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;