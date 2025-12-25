import {create_room, delete_room, get_all_room, get_room_by_id} from "../api/room.api";
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";

// Thunks
export const createRoom=createAsyncThunk(
    'room/createRoom',
    async (data, {rejectWithValue}) =>
    {
        try
        {
            const res=await create_room(data);
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||"Failed to create room");
        }
    }
);

export const getAllRooms=createAsyncThunk(
    'room/getAllRooms',
    async (_, {rejectWithValue}) =>
    {
        try
        {
            const res=await get_all_room();
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||"Failed to fetch rooms");
        }
    }
);

export const getRoomsById=createAsyncThunk(
    'room/getRoomsById',
    async (id, {rejectWithValue}) =>
    {
        try
        {
            const res=await get_room_by_id(id);
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||"Failed to fetch room");
        }
    }
);

export const deleteRoom=createAsyncThunk(
    'room/deleteRoom',
    async (id, {rejectWithValue}) =>
    {
        try
        {
            const res=await delete_room(id);
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||"Failed to delete room");
        }
    }
);

// Slice
const roomSlice=createSlice({
    name: "room",
    initialState: {
        room: null,
        allRooms: [],
        isLoading: false,
        error: null,
        success: false
    },
    reducers: {
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
            // Create Room
            .addCase(createRoom.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(createRoom.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                state.room=action.payload.room;
                state.success=true;
            })
            .addCase(createRoom.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
            })

            // Get All Rooms
            .addCase(getAllRooms.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(getAllRooms.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                state.allRooms=action.payload.rooms||action.payload;
                state.success=true;
            })
            .addCase(getAllRooms.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
            })

            // Get Room By ID
            .addCase(getRoomsById.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(getRoomsById.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                state.room=action.payload.room||action.payload;
                state.success=true;
            })
            .addCase(getRoomsById.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
            })

            // Delete Room
            .addCase(deleteRoom.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(deleteRoom.fulfilled, (state) =>
            {
                state.isLoading=false;
                state.room=null;
                state.success=true;
            })
            .addCase(deleteRoom.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
            });
    }
});

export const {clearError, clearSuccess}=roomSlice.actions;
export default roomSlice.reducer;