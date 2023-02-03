export enum Permission {

    VIEW_POSTS,
    CREATE_POSTS,
    EDIT_POSTS,
    DELETE_POSTS,

    MANAGE_USERS,

}

export class Role {    
    public name : string;
    public permissions : Permission[];

    constructor(name : string, permissions : Permission[]) {
        this.name = name;
        this.permissions = permissions;
    }
}

export function hasPermission(user : any, permission : Permission) : boolean {
    let hasPermission = false;

    user.status.roles.forEach((role : Role) => {
        if(role.permissions.includes(permission)) {
            hasPermission = true;
        }
    });

    return hasPermission;
}