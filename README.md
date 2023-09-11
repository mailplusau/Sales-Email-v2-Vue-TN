# NetSuite - Sales Email Sender

## Project setup
```
npm install
```

### Compiles and hot-reloads for simple UI debugging
Note: This mode run without NetSuite modules which greatly limits what the application can do
```
npm run serve
```

### Compiles, minifies and uploads to NetSuite file cabinet
Note: Output file name is under `netsuite.projectName` and `netsuite.suffixName` keys in `package.json`. 
These should be changed before running any npm commands for the first time.
```
npm run build
```

### Suitelet, Client script and NetSuite uploader setup
This project includes a Suitelet script and a Client script in `SuiteScripts` directory.

#### To upload the scripts to NetSuite:
- Copy `.env.example` and rename to `.env`
- Edit the `.env` file with the credentials needed to upload files to NetSuite file cabinet
- Once all the correct credentials are in place, the Suitelet script can be uploaded like so:
```
npm run upload-suitelet
```
Similarly, the Client script can also be uploaded like so:
```
npm run upload-client
```