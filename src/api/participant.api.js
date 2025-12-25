import axios from '../config/api.config'
export const add_participant=(data) => axios.post("/participant/add-participant", data);
export const get_participant_by_id=(id) => axios.get(`/participant/get-participant-by-id/${id}`);
export const get_participant_by_room_id=(id) => axios.get(`/participant/get-participant-by-room-id/${id}`);
export const update_participant=(id, data) => axios.put(`/participant/update-participant/${id}`, data);
export const delete_participant=(id) => axios.delete(`/participant/delete-participant/${id}`);