export class Role {    
    public name : string;
    public permissions : string[];

    constructor(name : string, permissions : string[]) {
        this.name = name;
        this.permissions = permissions;
    }
}

export function hasPermission(user : any, permission : string) : boolean {
    let hasPermission = false;

    user.status.roles.forEach((role : Role) => {
        if(role.permissions.includes(permission) || role.permissions.includes("ADMIN")) {
            hasPermission = true;
        }
    });

    return hasPermission;
}