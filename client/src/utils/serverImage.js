export function fromLocation(location, name) {
    let data = new FormData();
    data.append(name, location, location.name);

    return data;
}