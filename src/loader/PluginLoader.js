import { string }          from 'rollup-plugin-string';
import { NonFatalError }   from '@typhonjs-node-bundle/oclif-commons';

const s_CONFLICT_PACKAGES = ['rollup-plugin-string'];
const s_PACKAGE_NAME = '@typhonjs-node-rollup/plugin-string';

/**
 * Handles interfacing with the plugin manager adding event bindings to pass back a configured
 * instance of `rollup-plugin-string`.
 */
export default class PluginLoader
{
   /**
    * Returns the any modules that cause a conflict.
    *
    * @returns {string[]}
    */
   static get conflictPackages() { return s_CONFLICT_PACKAGES; }

   /**
    * Returns the `package.json` module name.
    *
    * @returns {string}
    */
   static get packageName() { return s_PACKAGE_NAME; }

   /**
    * Adds flags for various built in commands like `bundle`.
    *
    * Added flags include:
    * `--string`   - `-s` - Allows imports of string / text content.  - default: `(see below)` - env: {prefix}_STRING'
    *
    * TODO: Test bad user entered data with the underlying Rollup plugin to see if a verification functionn needs to be
    * added here.
    *
    * @param {object} eventbus - The eventbus to add flags to.
    *
    * @param {object} flags - The Oclif flags generator.
    */
   static addFlags(eventbus, flags)
   {
      eventbus.trigger('typhonjs:oclif:system:flaghandler:add', {
         command: 'bundle',
         pluginName: PluginLoader.packageName,
         flags: {
            string: flags.string({
               'char': 's',
               'description': 'Allows imports of string / text content.',
               'multiple': true,
               'default': function(context)
               {
                  const envVars = context === null ? {} : process.env;
                  const envVar = `${global.$$flag_env_prefix}_STRING`;

                  if (typeof envVars[envVar] === 'string')
                  {
                     let result = void 0;

                     // Treat it as a JSON array.
                     try { result = JSON.parse(envVars[envVar]); }
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

      const flags = await import(ev.pluginOptions.flagsModule);

      PluginLoader.addFlags(ev.eventbus, flags);
   }
}
