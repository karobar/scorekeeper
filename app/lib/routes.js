/* global Router */
/* global SubsManager */

var subs = new SubsManager();

// something changed in iron-router when it moved from 0.6 to 0.7 that impacted
// the way waitOn works.  It seems that adding the action section with
// this.ready and this.render does the trick that waitOn alone did in the past
// to make sure the data for each subscription is passed to the client before
// the template gets rendered.  The comment from maxhilland on May 18 near the
// bottom of the following link helped me find the solution:
// https://github.com/EventedMind/iron-router/issues/265
// However, based on my testing, it doesn't seem like the data section is
// necessary
Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  notFoundTemplate: 'notFound'
});

/** Route base class */
function Route(name, path) {
  this.name = name;
  this.path = path;
  
  this.actionDict = {
    path: this.path,
    
    yieldTemplates: {
      'header': { to: 'header' },
      'sidebar': { to: 'sidebar' }
    }
  };
}

/** RenderedRoute class extending Route */
function RenderedRoute(name, path, subscriptionManifest) {
  Route.call(this, name, path);
  
  //add an extra member "waiton" to the action dictionary
  this.actionDict["waitOn"] = function() {
    var subscriptions = [];
    for(var i = 0; i < subscriptionManifest.length; i++) {
      subscriptions.push(subs.subscribe(subscriptionManifest[i]));
    }
    return subscriptions;
  };
  //add an extra member "action" which renders
  this.actionDict["action"] = function() {
    if (this.ready()) {
      this.render();
    }
  };
}
RenderedRoute.prototype = new Route(); // make RenderedRoute inherit from a Route object
RenderedRoute.prototype.constructor = RenderedRoute;

// in the post above, it was suggested to call if(this.ready()) in the data
// hook to actually get the loadingTemplate to work, so this is being done
// for the home route below
Router.map(function() {
  var routes = [new RenderedRoute('home', 
                                  '/', 
                                  [
                                   'players',
                                   'combined_ratings',
                                   'singles_ratings',
                                   'offense_ratings',
                                   'defense_ratings'
                                  ]),
                new RenderedRoute('addmatch', 
                                  '/addmatch', 
                                  [
                                   'matches',
                                   'players'
                                  ]),  
                new RenderedRoute('addplayer', 
                                  '/addplayer', 
                                  [
                                   'players',
                                   'combined_ratings'
                                  ]),      
                new RenderedRoute('individualstats', 
                                  '/individualstats', 
                                  [
                                   'matches',
                                   'players',
                                   'combined_ratings',
                                   'singles_ratings',
                                   'offense_ratings',
                                   'defense_ratings'
                                  ]),
                new RenderedRoute('teamstats', 
                                  '/teamstats', 
                                  [
                                   'matches',
                                   'players'
                                  ]),
                new Route('rules', '/rules'),
                new Route('allmatches', '/allmatches'),
                // route with name 'notFound' that for example matches
                // '/non-sense/route/that-matches/nothing' and automatically 
                // renders template 'notFound'
                // HINT: Define a global not found route as the very last route 
                // in your router
                new Route('notFound', '*')
               ];
  
  for(var i = 0; i < routes.length; i++) {
    this.route(routes[i].name, routes[i].actionDict);
  }
});
