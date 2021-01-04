const { string }        = require('rollup-plugin-string');

const { flags }         = require('@oclif/command');

const { NonFatalError } = require('@typhonjs-node-bundle/oclif-commons');

/**
 * Handles interfacing with the plugin manager adding event bindings to pass back a configured
 * instance of `rollup-plugin-string`.
 */
class PluginHandler
{
   /**
    * Returns the configured input plugin for `rollup-plugin-string`
    *
    * @param {object} bundleData - The CLI config
    * @param {object} bundleData.cliFlags  - The CLI flags
    *
    * @returns {object} Rollup plugin
    */
   static getInputPlugin(bundleData = {})
   {
      if (bundleData.cliFlags && typeof bundleData.cliFlags.string === 'object')
      {
         return string(bundleData.cliFlags.string);
      }
   }

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
      ev.eventbus.on('typhonjs:oclif:bundle:plugins:main:input:get', PluginHandler.getInputPlugin, PluginHandler);
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
      global.$$pluginManager.add({ name: '@typhonjs-node-rollup/plugin-string', instance: PluginHandler });

      // Adds flags for various built in commands like `build`.
      s_ADD_FLAGS(opts.id);

      global.$$eventbus.trigger('log:debug', `plugin-string init hook running '${opts.id}'.`);
   }
   catch (error)
   {
      this.error(error);
   }
};

/**
 * Adds flags for various built in commands like `build`.
 *
 * Added flags include:
 * `--string`   - `-s` - Allows imports of string / text content.  - default: `(see below)` - env: DEPLOY_STRING'
 *
 * TODO: Test bad user entered data with the underlying Rollup plugin to see if a verification functionn needs to be
 * added here.
 *
 * @param {string} command - ID of the command being run.
 */
function s_ADD_FLAGS(command)
{
   switch (command)
   {
      // Add all built in flags for the build command.
      case 'bundle':
         global.$$eventbus.trigger('typhonjs:oclif:system:flaghandler:add', {
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
                           throw new NonFatalError(
                            `Could not parse 'DEPLOY_STRING' as a JSON array;\n${error.message}`);
                        }

                        if (!Array.isArray(result))
                        {
                           throw new NonFatalError(`Please format 'DEPLOY_STRING' as a JSON array.`);
                        }

                        return result;
                     }

                     return ['**/*.html', '**/*.hbs'];
                  }
               })
            },

            /**
             * Verifies the `string` flag and checks that the data loaded is an array and transforms the option
             * into the proper format which is `{ includes: [...data] }`
             *
             * @param {object}   flags - The CLI flags to verify.
             */
            verify: function(flags)
            {
               // replace should always be an array
               if (Array.isArray(flags.string))
               {
                  flags.string = { include: flags.string }
               }
            }
         });
         break;
   }
}