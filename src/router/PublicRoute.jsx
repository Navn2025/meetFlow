import React from 'react';
import {useSelector} from 'react-redux';
import {Navigate, Outlet} from 'react-router-dom';

const PublicRoutes=() =>
{

    const {isAuthenticated, token}=useSelector(state => state.auth);



    if (isAuthenticated||token)
    {
        return <Navigate to="/" replace />
    }

    // Render protected components
    return <Outlet />;
};

export default PublicRoutes;