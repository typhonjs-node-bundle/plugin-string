const { string }        = require('rollup-plugin-string');
const { flags }         = require('@oclif/command');
const { NonFatalError } = require('@typhonjs-node-bundle/oclif-commons');

/**
 * Handles interfacing with the plugin manager adding event bindings to pass back a configured
 * instance of `rollup-plugin-string`.
 */
class PluginLoader
{
   /**
    * Adds flags for various built in commands like `build`.
    *
    * Added flags include:
    * `--string`   - `-s` - Allows imports of string / text content.  - default: `(see below)` - env: {prefix}_STRING'
    *
    * TODO: Test bad user entered data with the underlying Rollup plugin to see if a verification functionn needs to be
    * added here.
    *
    * @param {string} command - ID of the command being run.
    * @param {object} eventbus - The eventbus to add flags to.
    */
   static addFlags(command, eventbus)
   {
      switch (command)
      {
         // Add all built in flags for the build command.
         case 'bundle':
            eventbus.trigger('typhonjs:oclif:system:flaghandler:add', {
               command,
               plugin: 'plugin-string',
               flags: {
                  string: flags.string({
                     'char': 's',
                     'description': 'Allows imports of string / text content.',
                     'multiple': true,
                     'default': function()
                     {
                        const envVar = `${global.$$flag_env_prefix}_STRING`;

                        if (typeof process.env[envVar] === 'string')
                        {
                           let result = void 0;

                           // Treat it as a JSON array.
                           try { result = JSON.parse(process.env[envVar]); }
                           catch (error)
                           {
                              throw new NonFatalError(
                                 `Could not parse '${envVar}' as a JSON array;\n${error.message}`);
                           }

                           if (!Array.isArray(result))
                           {
                              throw new NonFatalError(`Please format '${envVar}' as a JSON array.`);
                           }

                           return result;
                        }

                        return ['**/*.html'];
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
                     flags.string = { include: flags.string };
                  }
               }
            });
            break;
      }
   }

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
    * Returns the rollup plugins managed.
    *
    * @returns {string[]}
    */
   static get rollupPlugins() { return ['rollup-plugin-string']; }

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
      ev.eventbus.on('typhonjs:oclif:bundle:plugins:main:input:get', PluginLoader.getInputPlugin, PluginLoader);

      PluginLoader.addFlags(ev.pluginOptions.command, ev.eventbus);
   }
}

module.exports = PluginLoader;