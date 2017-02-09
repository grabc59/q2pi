'use strict';
const express = require('express');
const router = express.Router();
const knex = require('../knex');
var fs = require('fs');
const jwt = require('jsonwebtoken');
const privateKey = 'my_awesome_cookie_signing_key';
const aws = require('aws-sdk');
require('dotenv').config();
const S3_BUCKET = process.env.S3_BUCKET;
const s3 = new aws.S3();


const authorize = function(req, res, next) {
  const token = req.cookies.token;
  jwt.verify(token, privateKey, (err, decoded) => {
    if (err) {
      return res.redirect('/signin.html');
    }
    req.token = decoded;
    next();
  });
};


router.get('/', authorize, function(req, res, next) {

  knex('uploads')
    .join('users', 'users.id', '=', 'uploads.user_id')
    .select('uploads.name', 'uploads.category', 'users.username', 'uploads.created_at', 'uploads.path')
    .orderBy('users.username')
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      next(err);
    });
});

/*
 * Respond to GET requests to /sign-s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and
 * the anticipated URL of the image.
 */
router.get('/sign-s3', authorize, (req, res, next) => {

  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };

    knex('users')
    .where({
      email: req.token
    })
    .select('id')
    .first()
    .then((user) => {
      knex('uploads')
      .insert({
        name: fileName,
        path: returnData.url,
        // TODO: change category to the download_path, category is temporarily being used as the download path for client's 'file download' links
        category: returnData.url,
        user_id: user.id
      }, '*')
      .then((result) => {
        res.write(JSON.stringify(returnData));
        res.end();
      })
      .catch((err) => {
        next(err);
      });
    });
  });
});

// some code to try, maybe it will get DELETEs working on s3
// s3.deleteObjects({
//     Bucket: 'myprivatebucket/some/subfolders',
//     Delete: {
//         Objects: [
//              { Key: 'nameofthefile1.extension' },
//              { Key: 'nameofthefile2.extension' },
//              { Key: 'nameofthefile3.extension' }
//         ]
//     }
// }, function(err, data) {
//
//     if (err)
//         return console.log(err);
//
//     console.log('success');
//
// });
router.delete('/', authorize, (req, res, next) => {
  const fileName = req.body.fileName;
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName
  };
  console.log(s3Params);
  s3.deleteObject (s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    console.log("here comes the delete data", data);
    knex('uploads')
      .where({
        name: fileName
      })
      .first()
      .then((result) => {
        if (result && result.id) {
          return knex('uploads')
            .del()
            .where('id', result.id)
            .then((result) => {
              res.end('success\n' + result);
            })
            .catch((err) => {
              next(err);
            });
        } else {
          res.end('no result to delete');
        }
      });
  });
});



module.exports = router;
