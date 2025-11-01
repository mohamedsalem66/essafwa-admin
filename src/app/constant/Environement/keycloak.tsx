import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'https://keycloak.mms-rim.com/',
    realm: 'school',
    clientId: 'school-app'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
