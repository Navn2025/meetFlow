import axios from '../config/api.config';
export const create_room=(data) => axios.post('/room/create-room', data)
export const get_all_room=() => axios.get('/room/get-all-room');

export const get_room_by_id=(id) => axios.get(`/room/get-room-by-id/${id}`);
export const delete_room=(id) => axios.delete(`/room/delete-room/${id}`);