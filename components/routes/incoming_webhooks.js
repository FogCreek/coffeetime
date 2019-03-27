const debug = require('debug')('botkit:incoming_webhooks');
const express = require('express');
const router = express.Router();

const storage = require('./../../coffee_data_storage.js');

function onSlackRecieve(req, res) {

  // NOTE: we should enforce the token check here

  // respond to Slack that the webhook has been received.
  res.status(200);
  
  // Respond to an uninstall event, since AFAICT it's not handled by Botkit.
  if (req.body.event.type === 'app_uninstalled') {
    onAppUninstalled(req.body, req.controller);
  }

  // Now, pass the webhook into be processed.
  req.controller.handleWebhookPayload(req, res);
}

function onAppUninstalled(payload, controller) {
  console.log('uninstalling!!!!');
  // Delete this from the team database.
  controller.storage.teams.delete(payload.team_id);
  
  // Delete all users.
  // TODO: Once we support multiple teams, we should only delete the team 
  // whose app was uninstalled.
  storage.deleteAllData();
}

debug('Configured /slack/receive url');
router.post('/slack/receive', onSlackRecieve);

module.exports = router;

