import React from 'react';
import {Route, Routes} from 'react-router-dom';
import {Suspense, lazy} from "react";
import ProtectedRoutes from './ProtectedRoutes';
import PublicRoutes from './PublicRoute';
import CreateRoom from '../pages/CreateRoom';
import JoinRoom from '../pages/JoinRoom';
import Streaming from '../pages/Streaming';
import Room from '../pages/Room';
const Home=lazy(() => import('../pages/Home'));
const Login=lazy(() => import('../pages/Login'));
const Register=lazy(() => import('../pages/Register'));

const MainRoutes=() =>
{
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <Routes>
                {/* Public Routes */}
                <Route element={<PublicRoutes />}>

                    <Route path='/login' element={<Login />} />
                    <Route path='/register' element={<Register />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<ProtectedRoutes />}>
                    <Route path='/' element={<Home />} />
                    <Route path='/create-room' element={<CreateRoom />} />
                    <Route path='/join-room' element={<JoinRoom />} />
                    <Route path='/streaming' element={<Streaming />} />
                    <Route path='/room/:roomId' element={<Room />} />
                </Route>
            </Routes>
        </Suspense>
    );
};

export default MainRoutes;