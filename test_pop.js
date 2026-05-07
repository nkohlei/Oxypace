import mongoose from 'mongoose';
import Post from './models/Post.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/globalmessage2');
  const posts = await Post.find({ quotedPost: { $exists: true } }).sort({createdAt: -1}).limit(5);
  for(let post of posts) {
     const pop = await Post.findById(post._id).populate({
         path: 'quotedPost',
         populate: [
             { path: 'author' },
             { path: 'quotedPost', populate: [{path: 'author'}] }
         ]
     });
     console.log('Post ID:', post._id);
     console.log('Quoted Post:', pop.quotedPost ? pop.quotedPost._id : 'null');
     console.log('Nested Quoted Post Author:', pop.quotedPost && pop.quotedPost.quotedPost && pop.quotedPost.quotedPost.author ? typeof pop.quotedPost.quotedPost.author : 'not populated or missing');
  }
  mongoose.disconnect();
}
run();
