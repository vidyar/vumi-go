// go.campaign.dialogue.models
// ===========================
// Models for dialogue screen.

(function(exports) {
  var stateMachine = go.components.stateMachine,
      EndpointModel = stateMachine.EndpointModel,
      ConnectionModel = stateMachine.ConnectionModel,
      StateModel = stateMachine.StateModel,
      StateMachineModel = stateMachine.StateMachineModel;

  var DialogueEndpointModel = EndpointModel.extend({
  });

  var ChoiceEndpointModel = DialogueEndpointModel.extend();

  var DialogueStateModel = StateModel.extend({
    collectionType: 'go.campaign.dialogue.models.DialogueStateModelCollection',

    relations: [],

    subModelTypes: {
      dummy: 'go.campaign.dialogue.models.DummyStateModel',
      choice: 'go.campaign.dialogue.models.ChoiceStateModel',
      freetext: 'go.campaign.dialogue.models.FreeTextStateModel',
      end: 'go.campaign.dialogue.models.EndStateModel'
    },

    defaults: function() { return {uuid: uuid.v4()}; }
  });

  var DialogueStateModelCollection = Backbone.Collection.extend({
    model: DialogueStateModel,
    comparator: function(state) { return state.get('ordinal'); }
  });

  var DummyStateModel = DialogueStateModel.extend({
    relations: [{
      type: Backbone.HasOne,
      key: 'entry_endpoint',
      relatedModel: DialogueEndpointModel
    }, {
      type: Backbone.HasOne,
      key: 'exit_endpoint',
      relatedModel: DialogueEndpointModel
    }]
  });

  var ChoiceStateModel = DialogueStateModel.extend({
    relations: [{
      type: Backbone.HasOne,
      key: 'entry_endpoint',
      relatedModel: DialogueEndpointModel
    }, {
      type: Backbone.HasMany,
      key: 'choice_endpoints',
      relatedModel: ChoiceEndpointModel
    }]
  });

  var FreeTextStateModel = DialogueStateModel.extend({
    relations: [{
      type: Backbone.HasOne,
      key: 'entry_endpoint',
      relatedModel: DialogueEndpointModel
    }, {
      type: Backbone.HasOne,
      key: 'exit_endpoint',
      relatedModel: DialogueEndpointModel
    }]
  });

  var EndStateModel = DialogueStateModel.extend({
    relations: [{
      type: Backbone.HasOne,
      key: 'entry_endpoint',
      relatedModel: DialogueEndpointModel
    }]
  });

  var DialogueConnectionModel = ConnectionModel.extend({
    relations: [{
      type: Backbone.HasOne,
      key: 'source',
      includeInJSON: ['uuid'],
      relatedModel: DialogueEndpointModel
    }, {
      type: Backbone.HasOne,
      key: 'target',
      includeInJSON: ['uuid'],
      relatedModel: DialogueEndpointModel
    }]
  });

  var DialogueModel = Backbone.RelationalModel.extend({
    idAttribute: 'conversation',
    relations: [{
      type: Backbone.HasMany,
      key: 'states',
      relatedModel: DialogueStateModel
    }, {
      type: Backbone.HasOne,
      key: 'start_state',
      includeInJSON: ['uuid'],
      relatedModel: DialogueStateModel
    }, {
      type: Backbone.HasMany,
      key: 'connections',
      parse: true,
      relatedModel: DialogueConnectionModel
    }]
  });

  _(exports).extend({
    DialogueModel: DialogueModel,

    DialogueConnectionModel: DialogueConnectionModel,
    DialogueEndpointModel: DialogueEndpointModel,
    ChoiceEndpointModel: ChoiceEndpointModel,

    DialogueStateModel: DialogueStateModel,
    DummyStateModel: DummyStateModel,
    ChoiceStateModel: ChoiceStateModel,
    FreeTextStateModel: FreeTextStateModel,
    EndStateModel: EndStateModel
  });
})(go.campaign.dialogue.models = {});