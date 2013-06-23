// go.components.plumbing (diagrams)
// =================================
// Components for state diagrams (or 'plumbing views') in Go

(function(exports) {
  var structures = go.components.structures,
      Lookup = structures.Lookup,
      SubviewCollectionGroup = structures.SubviewCollectionGroup;

  var plumbing = go.components.plumbing,
      StateView = plumbing.StateView,
      ConnectionView = plumbing.ConnectionView,
      StateViewCollection = plumbing.StateViewCollection,
      ConnectionViewCollection = plumbing.ConnectionViewCollection,
      DiagramEndpointGroup = plumbing.DiagramEndpointGroup;

  var stateMachine = go.components.stateMachine,
      idOfConnection = stateMachine.idOfConnection;

  // Keeps connections between connection models in sync with the jsPlumb
  // connections in the UI
  var DiagramViewConnections = SubviewCollectionGroup.extend({
    constructor: function(options) {
      SubviewCollectionGroup.prototype.constructor.call(this, options);
      this.diagram = this.view; // alias for better context

      jsPlumb.bind(
        'connection',
        _.bind(this.onPlumbConnect, this));

      jsPlumb.bind(
        'connectionDetached',
        _.bind(this.onPlumbDisconnect, this));
    },

    // Returns the first connection collection found that accepts a connection
    // based on the type of the given source and target endpoints. We need this
    // to determine which connection collection a new connection made in the ui
    // belongs to.
    determineCollection: function(source, target) {
      var collections = this.members.values(),
          i = collections.length,
          c;

      while (i--) {
        c = collections[i];
        if (c.accepts(source, target)) { return c; }
      }

      return null;
    },

    onPlumbConnect: function(e) {
      var sourceId = e.source.attr('data-uuid'),
          targetId = e.target.attr('data-uuid'),
          connectionId = idOfConnection(sourceId, targetId);

      // Case 1:
      // -------
      // The connection model and its view have been added, but we haven't
      // rendered the view (drawn the jsPlumb connection) yet. We don't
      // need to add the connection since it already exists.
      if (this.has(connectionId)) { return; }

      // Case 2:
      // -------
      // The connection was created in the UI, so no model or view exists yet.
      // We need to create a new connection model and its view.
      var source = this.diagram.endpoints.get(sourceId),
          target = this.diagram.endpoints.get(targetId),
          collection = this.determineCollection(source, target);

      // Case 3:
      // -------
      // This kind of connection is not supported
      if (collection === null) {
        this.trigger('error:unsupported', source, target, e.connection);
        return;
      }

      collection.add({
        model: {source: source.model, target: target.model},
        plumbConnection: e.connection
      });
    },

    onPlumbDisconnect: function(e) {
      var sourceId = e.source.attr('data-uuid'),
          targetId = e.target.attr('data-uuid'),
          connectionId = idOfConnection(sourceId, targetId);

      // Case 1:
      // -------
      // The connection model and its view have been removed from its
      // collection, so its connection view was destroyed (along with the
      // jsPlumb connection). We don't need to remove the connection model
      // and view since they no longer exists.
      if (!this.has(connectionId)) { return; }

      // Case 2:
      // -------
      // The connection was removed in the UI, so the model and view still
      // exist. We need to remove them.
      var collection = this.ownerOf(connectionId);
      collection.remove(connectionId, {removeModel: true});
    }
  });

  // The main view for the state diagram. Delegates interactions between
  // the states and their endpoints.
  var DiagramView = Backbone.View.extend({
    // Override to change how the states map to the diagram view's model
    stateSchema: [{attr: 'states'}],

    // Override to change the default state view type
    stateType: StateView,

    // Override to change the default state view collection type
    stateCollectionType: StateViewCollection,

    // Override to change how the connections map to the diagram view's model
    connectionSchema: [{attr: 'connections'}],

    // Override to change the connection view type
    connectionType: ConnectionView,

    // Override to change the default connection view collection type
    connectionCollectionType: ConnectionViewCollection,

    initialize: function() {
      // Lookup/Manager of all the states in the diagram
      this.states = new SubviewCollectionGroup({
        view: this,
        schema: this.stateSchema,
        schemaDefaults: {type: this.stateType},
        collectionType: this.stateCollectionType
      });

      // Lookup/Manager of all the endpoints in the diagram
      this.endpoints = new DiagramEndpointGroup(this);

      // Lookup/Manager of all the connections in the diagram
      this.connections = new DiagramViewConnections({
        view: this,
        schema: this.connectionSchema,
        schemaDefaults: {type: this.connectionType},
        collectionType: this.connectionCollectionType
      });

      // Set the view as the default container so jsPlumb connects endpoint
      // elements properly.
      //
      // https://github.com/sporritt/jsPlumb/wiki/setup
      // #overriding-the-default-behaviour
      jsPlumb.Defaults.Container = this.$el;
    },

    render: function() {
      this.states.render();
      this.connections.render();
      return this;
    }
  });

  _.extend(exports, {
    // Components intended to be used and extended
    DiagramView: DiagramView,

    // Secondary components
    DiagramViewConnections: DiagramViewConnections
  });
})(go.components.plumbing);
