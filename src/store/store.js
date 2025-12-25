import {configureStore} from "@reduxjs/toolkit";
import roomReducer from './room.slice';
import authReducer from './auth.slice';
import participantReducer from './participant.slice';

const store=configureStore({
    reducer: {
        auth: authReducer,
        room: roomReducer,
        participant: participantReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        }),
    devTools: import.meta.env.DEV
});
export default store;