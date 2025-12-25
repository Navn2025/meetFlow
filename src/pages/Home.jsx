import {Link} from 'react-router-dom';
import {VideoIcon, UsersIcon, HostIcon} from '../components/icons/Icons.jsx';

const Home=() =>
{
    const isLoggedIn=!!localStorage.getItem('token');

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navigation */}
            <nav className="border-b border-neutral-800 bg-neutral-950">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <VideoIcon className="w-8 h-8" />
                        <span className="text-xl font-bold tracking-tight">MeetFlow</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        {isLoggedIn? (
                            <>
                                <Link to="/streaming" className="text-neutral-400 hover:text-white transition font-medium">
                                    Dashboard
                                </Link>
                                <Link
                                    to="/create-room"
                                    className="bg-white text-black px-4 sm:px-5 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition"
                                >
                                    New Meeting
                                </Link>
                            </>
                        ):(
                            <>
                                <Link to="/login" className="text-neutral-400 hover:text-white transition font-medium">
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-white text-black px-4 sm:px-5 py-2 rounded-lg font-semibold hover:bg-neutral-200 transition"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-3 sm:px-6 py-16 sm:py-24 text-center">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
                    Video meetings for
                    <br />
                    <span className="text-neutral-400">everyone</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
                    Connect, collaborate, and communicate with crystal-clear video
                    conferencing built for teams of any size. Up to 100+ participants.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    {isLoggedIn? (
                        <>
                            <Link
                                to="/create-room"
                                className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-neutral-200 transition"
                            >
                                Start a Meeting
                            </Link>
                            <Link
                                to="/join-room"
                                className="border-2 border-neutral-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:border-white transition"
                            >
                                Join Meeting
                            </Link>
                        </>
                    ):(
                        <>
                            <Link
                                to="/register"
                                className="bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-neutral-200 transition"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                to="/login"
                                className="border-2 border-neutral-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:border-white transition"
                            >
                                Sign In
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="border-t border-neutral-800 bg-neutral-950">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-12 sm:py-20">
                    <h2 className="text-3xl font-bold text-center mb-16">Why choose MeetFlow?</h2>
                    <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                        <div className="p-8 border border-neutral-800 rounded-xl hover:border-neutral-600 transition">
                            <div className="w-12 h-12 bg-white text-black rounded-lg flex items-center justify-center mb-6">
                                <VideoIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">HD Video Quality</h3>
                            <p className="text-neutral-400">
                                Crystal-clear video with adaptive quality that adjusts to your connection speed.
                            </p>
                        </div>
                        <div className="p-8 border border-neutral-800 rounded-xl hover:border-neutral-600 transition">
                            <div className="w-12 h-12 bg-white text-black rounded-lg flex items-center justify-center mb-6">
                                <UsersIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">100+ Participants</h3>
                            <p className="text-neutral-400">
                                Host large meetings with up to 150 participants using our scalable infrastructure.
                            </p>
                        </div>
                        <div className="p-8 border border-neutral-800 rounded-xl hover:border-neutral-600 transition">
                            <div className="w-12 h-12 bg-white text-black rounded-lg flex items-center justify-center mb-6">
                                <HostIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
                            <p className="text-neutral-400">
                                End-to-end encrypted meetings with host controls and participant management.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-neutral-800">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 text-neutral-400">
                            <VideoIcon className="w-5 h-5" />
                            <span className="font-semibold">MeetFlow</span>
                        </div>
                        <p className="text-neutral-500 text-sm">
                            Built with WebRTC & mediasoup
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;