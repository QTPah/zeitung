import React, { useEffect, useState } from 'react'
import ButtonInput from '../../components/form/ButtonInput/ButtonInput';
import ImageInput from '../../components/form/ImageInput/ImageInput';
import TextareaInput from '../../components/form/TextareaInput/TextaraInput';
import TextInput from '../../components/form/TextInput/TextInput';
import { fromLocation } from '../../utils/serverImage';
import { useApi } from '../../contexts/ApiContext/ApiContext';
import './Posts.css'
import FileInput from '../../components/form/FileInput/FileInput';

const PostCreator = () => {

    const api = useApi();

    const [title, setTitle] = useState();
    const [lead, setLead] = useState();
    const [channel, setChannel] = useState();
    const [body, setBody] = useState();
    const [image, setImage] = useState();

    return (
        <div className="postCreatorPopup">
            <TextInput placeholder="Channel" onChange={(e) => setChannel(e.target.value)} />
            <TextInput placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
            <TextareaInput placeholder="Lead" onChange={(e) => setLead(e.target.value)} />
            <ImageInput label="Foto" onChange={async (e) => {
                setImage(fromLocation(e.target.files[0], 'image'));
            }} />
            <FileInput label="Body" onChange={async (e) => {
                setBody(fromLocation(e.target.files[0], "file"));
            }} />
            <ButtonInput label="Submit" onClick={async () => {
                let imageIndex = await api.uploadImage(image);
                let bodyIndex = await api.upload(body);
                if(imageIndex && bodyIndex) {
                    await api.post(title, lead, bodyIndex, channel, imageIndex);
                    location.reload();
                }
            }} />
        </div>
    )
}

export default PostCreator