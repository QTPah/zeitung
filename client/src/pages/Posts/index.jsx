import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/form/Card/Card'

import Navbar from '../../components/ui/Navbar/Navbar'
import { useApi } from '../../contexts/ApiContext/ApiContext'
import { useAuth } from '../../contexts/AuthContext/AuthContext'
import usePopup from '../../hooks/Popup/usePopup'
import PostCreator from './postCreator'


const Posts = () => {

    const api = useApi();
    const auth = useAuth();
    const navigate = useNavigate();

    const [postViewer, setPostViewer] = useState();

    const [posts, setPosts] = useState();
    const [popup, popupElement] = usePopup();

    const setupPosts = async () => {
        let res = await api.getPosts();
        let _posts = [];
        for(let i = 0; i < res.length; i++) {
            let image = await api.getImage(res[i].image);
            _posts.push(<Card key={res[i]._id} title={res[i].title} description={res[i].lead} image={image} onClick={() => {
                navigate('/posts/view?id='+res[i]._id)
            }} />);
        }
        setPosts(_posts);
    }

    useEffect(() => {
        setupPosts();
    }, []);

    return (
        <>
            <Navbar />
            {auth.hasPermission("CREATE_POSTS") && <button className='addButton' onClick={() => {
                popup("Create Post", <PostCreator />);
            }}>+</button>}
            <div className='postsContainer'>
                {posts && posts}
            </div>
            {popupElement}
        </>
    )
}

export default Posts