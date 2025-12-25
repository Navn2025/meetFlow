import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Link, useNavigate} from 'react-router-dom';
import {getAllRooms} from '../store/room.slice';
import {VideoIcon, UsersIcon, PlayIcon} from '../components/icons/Icons.jsx';

const Streaming=() =>
{
    const dispatch=useDispatch();
    const navigate=useNavigate();
    const {allRooms, isLoading, error}=useSelector(state => state.room);
    const userName=localStorage.getItem('userName')||'User';

    useEffect(() =>
    {
        dispatch(getAllRooms());
    }, [dispatch]);

    const handleLogout=() =>
    {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="border-b border-neutral-800 bg-neutral-950">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-white">
                        <VideoIcon className="w-7 h-7" />
                        <span className="text-xl font-bold tracking-tight">MeetFlow</span>
                    </Link>
                    <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                        <span className="text-neutral-400">
                            Welcome, <span className="text-white font-medium">{userName}</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-neutral-400 hover:text-white transition font-medium"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-3 sm:px-6 py-10 sm:py-12">
                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-12">
                    <Link
                        to="/create-room"
                        className="p-8 bg-white text-black rounded-xl hover:bg-neutral-200 transition group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
                                <PlayIcon className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-semibold">New Meeting</h2>
                        </div>
                        <p className="text-neutral-600">
                            Start a new meeting and invite participants to join
                        </p>
                    </Link>

                    <Link
                        to="/join-room"
                        className="p-8 bg-neutral-900 border border-neutral-800 text-white rounded-xl hover:border-neutral-600 transition group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center">
                                <UsersIcon className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-semibold">Join Meeting</h2>
                        </div>
                        <p className="text-neutral-400">
                            Enter a meeting code to join an existing meeting
                        </p>
                    </Link>
                </div>

                {/* Available Rooms */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Available Rooms</h2>

                    {isLoading? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ):error? (
                        <div className="text-center py-12">
                            <p className="text-red-400">{error}</p>
                        </div>
                    ):allRooms.length>0? (
                        <div className="grid gap-3 sm:gap-4">
                            {allRooms.map((room) => (
                                <div
                                    key={room._id}
                                    className="flex items-center justify-between p-5 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-600 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                                            <VideoIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{room.name}</h3>
                                            <p className="text-neutral-500 text-sm font-mono">
                                                {room._id}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/room/${room._id}`}
                                        className="bg-white text-black px-4 sm:px-5 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition text-sm"
                                    >
                                        Join
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ):(
                        <div className="text-center py-12 border border-neutral-800 rounded-xl bg-neutral-950">
                            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <VideoIcon className="w-8 h-8 text-neutral-600" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">No rooms available</h3>
                            <p className="text-neutral-500 mb-6">Create a new room to get started</p>
                            <Link
                                to="/create-room"
                                className="inline-block bg-white text-black px-5 sm:px-6 py-2.5 rounded-lg font-semibold hover:bg-neutral-200 transition"
                            >
                                Create Room
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Streaming;