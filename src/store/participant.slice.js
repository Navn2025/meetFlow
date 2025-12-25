import
{
    add_participant,
    get_participant_by_id,
    get_participant_by_room_id,
    update_participant,
    delete_participant
} from '../api/participant.api';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

// Thunks
export const createParticipant=createAsyncThunk(
    'participant/createParticipant',
    async (data, {rejectWithValue}) =>
    {
        try
        {
            const res=await add_participant(data);
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||'Failed to add participant');
        }
    }
);

export const getParticipantById=createAsyncThunk(
    'participant/getParticipantById',
    async (id, {rejectWithValue}) =>
    {
        try
        {
            const res=await get_participant_by_id(id);
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||'Failed to fetch participant');
        }
    }
);

export const getParticipantsByRoomId=createAsyncThunk(
    'participant/getParticipantsByRoomId',
    async (roomId, {rejectWithValue}) =>
    {
        try
        {
            const res=await get_participant_by_room_id(roomId);
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||'Failed to fetch room participants');
        }
    }
);

export const updateParticipant=createAsyncThunk(
    'participant/updateParticipant',
    async ({id, data}, {rejectWithValue}) =>
    {
        try
        {
            const res=await update_participant(id, data);
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||'Failed to update participant');
        }
    }
);

export const deleteParticipant=createAsyncThunk(
    'participant/deleteParticipant',
    async (id, {rejectWithValue}) =>
    {
        try
        {
            const res=await delete_participant(id);
            return res.data;
        } catch (error)
        {
            return rejectWithValue(error.response?.data?.message||'Failed to delete participant');
        }
    }
);

// Slice
const participantSlice=createSlice({
    name: 'participant',
    initialState: {
        participant: null,
        participants: [],           // All participants in a room
        isLoading: false,
        error: null,
        success: false,
        currentRoomId: null
    },
    reducers: {
        clearError: (state) =>
        {
            state.error=null;
        },
        clearSuccess: (state) =>
        {
            state.success=false;
        },
        setCurrentRoomId: (state, action) =>
        {
            state.currentRoomId=action.payload;
        },
        clearParticipants: (state) =>
        {
            state.participants=[];
            state.participant=null;
        }
    },
    extraReducers: (builder) =>
    {
        builder
            // Add Participant
            .addCase(createParticipant.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(createParticipant.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                state.participant=action.payload.participant;
                state.participants.push(action.payload.participant);
                state.success=true;
            })
            .addCase(createParticipant.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
            })

            // Get Participant By ID
            .addCase(getParticipantById.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(getParticipantById.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                state.participant=action.payload.participant||action.payload;
                state.success=true;
            })
            .addCase(getParticipantById.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
            })

            // Get Participants By Room ID
            .addCase(getParticipantsByRoomId.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(getParticipantsByRoomId.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                // Handle both array and object responses
                state.participants=Array.isArray(action.payload.participants)
                    ? action.payload.participants
                    :action.payload.participants||action.payload||[];
                state.success=true;
            })
            .addCase(getParticipantsByRoomId.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
            })

            // Update Participant
            .addCase(updateParticipant.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(updateParticipant.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                const updatedParticipant=action.payload.data||action.payload;
                state.participant=updatedParticipant;

                // Update in participants array
                const index=state.participants.findIndex(p => p._id===updatedParticipant._id);
                if (index!==-1)
                {
                    state.participants[index]=updatedParticipant;
                }
                state.success=true;
            })
            .addCase(updateParticipant.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
            })

            // Delete Participant
            .addCase(deleteParticipant.pending, (state) =>
            {
                state.isLoading=true;
                state.error=null;
            })
            .addCase(deleteParticipant.fulfilled, (state, action) =>
            {
                state.isLoading=false;
                const deletedId=action.payload.data?._id||action.payload._id;

                // Remove from participants array
                state.participants=state.participants.filter(p => p._id!==deletedId);

                // Clear if it was the current participant
                if (state.participant?._id===deletedId)
                {
                    state.participant=null;
                }
                state.success=true;
            })
            .addCase(deleteParticipant.rejected, (state, action) =>
            {
                state.isLoading=false;
                state.error=action.payload;
            });
    }
});

export const {clearError, clearSuccess, setCurrentRoomId, clearParticipants}=participantSlice.actions;
export default participantSlice.reducer;