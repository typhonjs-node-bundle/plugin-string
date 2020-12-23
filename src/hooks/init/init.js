const { flags }   = require('@oclif/command');

/**
 * Handles interfacing with the plugin manager adding event bindings to pass back a configured
 * instance of `rollup-plugin-string`.
 */
class PluginHandler
{
   /**
    * @returns {string}
    */
   static test() { return 'some testing'; }

   /**
    * Wires up PluginHandler on the plugin eventbus.
    *
    * @param {PluginEvent} ev - The plugin event.
    *
    * @see https://www.npmjs.com/package/typhonjs-plugin-manager
    *
    * @ignore
    */
   static onPluginLoad(ev)
   {
      // TODO: ADD EVENT REGISTRATION
      // eventbus.on(`${eventPrepend}test`, PluginHandler.test, PluginHandler);
   }
}

/**
 * Oclif init hook to add PluginHandler to plugin manager.
 *
 * @param {object} opts - options of the CLI action.
 *
 * @returns {Promise<void>}
 */
module.exports = async function(opts)
{
   try
   {
      process.pluginManager.add({ name: 'plugin-string', instance: PluginHandler });

      // Adds flags for various built in commands like `build`.
      s_ADD_FLAGS(opts.id);

      // TODO REMOVE
      process.stdout.write(`plugin-string init hook running ${opts.id}\n`);
   }
   catch (error)
   {
      this.error(error);
   }
};

/**
 * Adds flags for various built in commands like `build`.
 *
 * @param {string} command - ID of the command being run.
 */
function s_ADD_FLAGS(command)
{
   switch (command)
   {
      // Add all built in flags for the build command.
      case 'build':
         process.eventbus.trigger('oclif:system:flaghandler:add', {
            command,
            plugin: 'plugin-string',
            flags: {
               string: flags.string({
                  'char': 's',
                  'description': 'Allows imports of string / text content.',
                  'multiple': true,
                  'default': function()
                  {
                     if (typeof process.env.DEPLOY_STRING === 'string')
                     {
                        let result = void 0;

                        // Treat it as a JSON array.
                        try { result = JSON.parse(process.env.DEPLOY_STRING); }
                        catch (error)
                        {
                           const parseError = new Error(
                            `Could not parse 'DEPLOY_STRING' as a JSON array;\n${error.message}`);

                           // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
                           parseError.$$bundler_fatal = false;

                           throw parseError;
                        }

                        if (!Array.isArray(result))
                        {
                           const parseError = new Error(`Please format 'DEPLOY_STRING' as a JSON array.`);

                           // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
                           parseError.$$bundler_fatal = false;

                           throw parseError;
                        }

                        return result;
                     }

                     return ['**/*.html'];
                  }
               })
            }
         });
         break;
   }
}