import React, { useEffect, useState } from 'react'
import Navbar from '../../components/ui/Navbar/Navbar';
import { useApi } from '../../contexts/ApiContext/ApiContext';

import * as mammoth from 'mammoth/mammoth.browser';

const PostViewer = () => {

    const postId = new URLSearchParams(location.search).get('id');

    const [post, setPost] = useState();

    const [html, setHtml] = useState();

    const api = useApi();

    useEffect(() => {
        api.getPost(postId).then((res) => {
            setPost(res);
            
            setHtml(res.body);
        });
    }, []);

    return (
        <>
            <Navbar />
            <div className='postViewer'>
            {!post ? <h1>Loading...</h1> : <>
            
                <h1>{post.title}</h1>

                <h2>{post.lead}</h2>

                {html && <div className="postBody" dangerouslySetInnerHTML={{__html: post.body.value }}></div>}

            </>}
            </div>
        </>
    )
}

export default PostViewer