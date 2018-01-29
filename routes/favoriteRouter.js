const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({ user: req.user._id })
    .populate('user dishes')
    .exec((err, favorites) => {
        if (err) return next(err);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    });
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if (favorite) {
            req.body.forEach(fave => {
                if (favorite.dishes.indexOf(fave._id) === -1)
                    favorite.dishes.push(fave);
            });

            favorite.save()
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
            .catch(err => next(err));
        } else {
            Favorites.create({})
            .then((newFavorite) => {
                req.body.forEach(fave => {
                    newFavorite.dishes.push(fave);
                });
                
                newFavorite.user = req.user._id;
                newFavorite.save()
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }, (err) => next(err))
                .catch(err => next(err));
            }, (err) => next(err))
            .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOneAndRemove({user: req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .the((favorites) => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites})
        } else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites})
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites})
            }
        }
    }, (err) => next(err))
    .catch((err) => next(err))
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if (favorite) {
            if (favorite.dishes.indexOf(req.params.dishId) === -1)
                favorite.dishes.push({"_id": req.params.dishId});

            favorite.save()
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }), (err) => next(err)
            .catch((err) => next(err));
        } else {
            Favorites.create({})
            .then((newFavorite) => {
                newFavorite.dishes.push({"_id": req.params.dishId});
                newFavorite.user = req.user._id;

                newFavorite.save()
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }, (err) => next(err))
                .catch(err => next(err));
            }, (err) => next(err))
            .catch((err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if (favorite) {
            const index = favorite.dishes.indexOf(req.params.dishId);
            if (index > -1) {
                favorite.dishes.splice(index, 1);
            }

            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('user dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                });
            }), (err) => next(err)
            .catch((err) => next(err));
        } else {
            err = new Error('No favorites found to delete.');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;