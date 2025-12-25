import {get_user, login_user, register_user} from '../api/auth.api';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

// Thunks
export const registerUser=createAsyncThunk(
    'auth/register',
    async (data, {rejectWithValue}) =>
    {
        try
        {
            const res=await register_user(data);
            if (res.data.token)
            {
                localStorage.setItem('token', res.data.token);
            }
            // Store userName from registration
            if (res.data.user?.name)
            {
                localStorage.setItem('userName', res.data.user.name);
            }
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||'Registration failed');
        }
    }
);

export const loginUser=createAsyncThunk(
    'auth/login',
    async (data, {rejectWithValue}) =>
    {
        try
        {
            const res=await login_user(data);
            // Store token in localStorage
            if (res.data.token)
            {
                localStorage.setItem('token', res.data.token);
            }
            // Store userName from login
            if (res.data.user?.name)
            {
                localStorage.setItem('userName', res.data.user.name);
            }
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||'Login failed');
        }
    }
);

export const getUser=createAsyncThunk(
    'auth/getUser',
    async (_, {rejectWithValue}) =>
    {
        try
        {
            const res=await get_user();
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||'Failed to fetch user', error);
        }
    }
);

// Slice
const authSlice=createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: localStorage.getItem('token')||null,
        isLoading: false,
        error: null,
        isAuthenticated: !!localStorage.getItem('token'),
        success: false
    },
    reducers: {
        logout: (state) =>
        {
            state.user=null;
            state.token=null;
            state.isAuthenticated=false;
            state.error=null;
            localStorage.removeItem('authToken');
        },
        clearError: (state) =>
        {
            state.error=null;
        },
        clearSuccess: (state) =>
        {
            state.success=false;
        }
    },
    extraReducers: (builder) =>
    {
        builder
            // Register User
            .addCase(registerUser.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(registerUser.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                state.user=action.payload.user;
                state.token=action.payload.token;
                state.isAuthenticated=true;
                state.success=true;
            })
            .addCase(registerUser.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
                state.isAuthenticated=false;
            })

            // Login User
            .addCase(loginUser.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(loginUser.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                state.user=action.payload.user;
                state.token=action.payload.token;
                state.isAuthenticated=true;
                state.success=true;
            })
            .addCase(loginUser.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
                state.isAuthenticated=false;
            })

            // Get User
            .addCase(getUser.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(getUser.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                state.user=action.payload.user||action.payload;
                state.isAuthenticated=true;
                state.success=true;
            })
            .addCase(getUser.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
                state.isAuthenticated=false;
                state.token=null;
                localStorage.removeItem('authToken');
            });
    }
});

export const {logout, clearError, clearSuccess}=authSlice.actions;
export default authSlice.reducer;