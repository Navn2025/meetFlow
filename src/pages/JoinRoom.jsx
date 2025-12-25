import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Link, useNavigate} from 'react-router-dom';
import {VideoIcon, UsersIcon} from '../components/icons/Icons.jsx';

const JoinRoom=() =>
{
    const navigate=useNavigate();
    const [error, setError]=useState('');
    const {register, handleSubmit, formState: {errors, isSubmitting}}=useForm();

    const join=async (data) =>
    {
        const roomId=data.roomId?.trim();

        if (!roomId)
        {
            setError('Please enter a room ID');
            return;
        }

        setError('');
        navigate(`/room/${roomId}`);
    };

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Header */}
            <header className="border-b border-neutral-800">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-white">
                        <VideoIcon className="w-7 h-7" />
                        <span className="text-xl font-bold tracking-tight">MeetFlow</span>
                    </Link>
                    <Link to="/streaming" className="text-neutral-400 hover:text-white transition font-medium">
                        Dashboard
                    </Link>
                </div>
            </header>

            {/* Join Room Form */}
            <div className="flex-1 flex items-center justify-center px-3 sm:px-6 py-10 sm:py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-neutral-900 border border-neutral-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <UsersIcon className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Join a meeting</h1>
                        <p className="text-neutral-400">Enter the room code to join</p>
                    </div>

                    <form onSubmit={handleSubmit(join)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Room Code
                            </label>
                            <input
                                {...register("roomId", {required: "Room code is required"})}
                                type="text"
                                placeholder="Enter room ID"
                                className="w-full bg-neutral-900 border border-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white transition placeholder-neutral-500 text-center text-lg tracking-wider"
                            />
                            {errors?.roomId&&(
                                <span className="text-red-400 mt-1.5 text-sm block">
                                    {errors.roomId.message}
                                </span>
                            )}
                            {error&&(
                                <span className="text-red-400 mt-1.5 text-sm block">
                                    {error}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-white text-black py-3.5 rounded-lg font-semibold hover:bg-neutral-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting? 'Joining...':'Join Meeting'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-neutral-500 text-sm mb-4">Want to host your own meeting?</p>
                        <Link
                            to="/create-room"
                            className="inline-block border-2 border-neutral-600 text-white px-5 sm:px-6 py-2.5 rounded-lg font-medium hover:border-white transition"
                        >
                            Create a Room
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinRoom;