// const Cookies = require('js-cookie');
import { isBot } from '../platform/platform';

/*
 * Configuration values needed in js codes
 *
 * NOTE:
 * Please use the following command to avoid accidentally committing personal changes
 * git update-index --assume-unchanged packages/shared/src/utils/config.js
 *
 */
export const domain_app_ids = {
    // these domains as supported "production domains"
    'deriv.app': 16929,
};
const binary_desktop_app_id = 14473;

export const getCurrentProductionDomain = () =>
    !/^staging\./.test(window.location.hostname) &&
    Object.keys(domain_app_ids).find(domain => new RegExp(`.${domain}$`, 'i').test(window.location.hostname));

export const isProduction = () => {
    const all_domains = Object.keys(domain_app_ids).map(domain => `(www\\.)?${domain.replace('.', '\\.')}`);
    return new RegExp(`^(${all_domains.join('|')})$`, 'i').test(window.location.hostname);
};

export const getAppId = () => {
    let app_id = null;
    const user_app_id = ''; // you can insert Application ID of your registered application here
    const config_app_id = window.localStorage.getItem('config.app_id');
    if (config_app_id) {
        app_id = config_app_id;
    } else if (/desktop-app/i.test(window.location.href) || window.localStorage.getItem('config.is_desktop_app')) {
        window.localStorage.removeItem('config.default_app_id');
        window.localStorage.setItem('config.is_desktop_app', 1);
        app_id = binary_desktop_app_id;
    } else if (user_app_id.length) {
        window.localStorage.setItem('config.default_app_id', user_app_id);
        app_id = user_app_id;
    } else if (/staging\.deriv\.app/i.test(window.location.hostname)) {
        window.localStorage.removeItem('config.default_app_id');
        app_id = isBot() ? 19112 : 16303; // it's being used in endpoint chrome extension - please do not remove
    } else if (/localhost/i.test(window.location.hostname)) {
        app_id = 17044;
    } else {
        window.localStorage.removeItem('config.default_app_id');
        const current_domain = getCurrentProductionDomain();
        app_id = domain_app_ids[current_domain] || (isBot() ? 19111 : 16929);
    }
    return app_id;
};

export const getSocketURL = () => {
    let server_url = window.localStorage.getItem('config.server_url');
    if (!server_url) {
        // const to_green_percent = { real: 100, virtual: 0, logged_out: 0 }; // default percentage
        // const category_map     = ['real', 'virtual', 'logged_out'];
        // const percent_values   = Cookies.get('connection_setup'); // set by GTM
        //
        // // override defaults by cookie values
        // if (percent_values && percent_values.indexOf(',') > 0) {
        //     const cookie_percents = percent_values.split(',');
        //     category_map.map((cat, idx) => {
        //         if (cookie_percents[idx] && !isNaN(cookie_percents[idx])) {
        //             to_green_percent[cat] = +cookie_percents[idx].trim();
        //         }
        //     });
        // }

        // let server = 'blue';
        // if (/www\.binary\.com/i.test(window.location.hostname)) {
        //     const loginid = window.localStorage.getItem('active_loginid');
        //     let client_type = category_map[2];
        //     if (loginid) {
        //         client_type = /^VRT/.test(loginid) ? category_map[1] : category_map[0];
        //     }
        //
        //     const random_percent = Math.random() * 100;
        //     if (random_percent < to_green_percent[client_type]) {
        //         server = 'green';
        //     }
        // }

        // TODO: in order to use connection_setup config, uncomment the above section and remove next lines

        const loginid = window.localStorage.getItem('active_loginid');
        const is_real = loginid && !/^VRT/.test(loginid);
        const server = isProduction() && is_real ? 'green' : 'blue';

        server_url = `${server}.binaryws.com`;
    }
    return server_url;
};

export const checkAndSetEndpointFromUrl = () => {
    if (/^(staging\.deriv\.app|(.*)\.binary\.sx)$/i.test(location.hostname)) {
        const url_params = new URLSearchParams(location.search.slice(1));

        if (url_params.has('qa_server') && url_params.has('app_id')) {
            const qa_server = url_params.get('qa_server');
            const app_id = url_params.get('app_id');

            url_params.delete('qa_server');
            url_params.delete('app_id');

            if (/^(www\.binaryqa[0-9]{1,2}\.com|(.*)\.binaryws\.com)$/.test(qa_server) && /^[0-9]+$/.test(app_id)) {
                localStorage.setItem('config.app_id', app_id);
                localStorage.setItem('config.server_url', qa_server);
            }

            const params = url_params.toString();
            location.href = `${location.protocol}//${location.hostname}${location.pathname}${
                params ? `?${params}` : ''
            }`;
        }
    }
};
