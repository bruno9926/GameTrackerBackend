export default class Game {
    id: string | number;
    name: string;
    status : 'playing' | 'completed' | 'wishlist' | 'paused'
}