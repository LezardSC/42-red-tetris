class UserManager {
    users: {[id: string]: string} = {};

    public addUser(id: string, name: string) {
        this.users[id] = name;
    }

    public removeUser(id: string) {
        delete this.users[id];
    }

    public getUserName(id: string | undefined) {
        if (id == null) {
            return undefined;
        }
        return this.users[id];
    }
}


export default UserManager