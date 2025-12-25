import React from 'react';
import {useSelector} from 'react-redux';
import {Navigate, Outlet} from 'react-router-dom';

const ProtectedRoutes=() =>
{

    const {isAuthenticated, token}=useSelector(state => state.auth);


    // Check if user is authenticated
    if (!isAuthenticated||!token)
    {
        return <Navigate to="/login" replace />;
    }


    // Render protected components
    return <Outlet />;
};

export default ProtectedRoutes;