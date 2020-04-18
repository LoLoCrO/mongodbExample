import mongo from 'mongodb';
import circulationRepo from './repos/circulationRepo';
import data from './circulation';
import { url, dbName } from './constants';
import assert from 'assert';

const main = async () => {

    const { MongoClient } = mongo;

    const client = await MongoClient(url, { useUnifiedTopology: true });
    await client.connect();

    try {
        const results = await circulationRepo(client).loadData(data);
        assert.equal(data.length, results.insertedCount);

        const getData = await circulationRepo(client).get();
        assert.equal(data.length, getData.length);

        const filterData = await circulationRepo(client).get({ Newspaper: getData[4].Newspaper });
        assert.deepEqual(filterData[0], getData[4]);

        const limitData = await circulationRepo(client).get({}, 3);
        assert.equal(limitData.length, 3);

        const id = getData[4]._id.toString();
        const byId = await circulationRepo(client).getById(id);
        assert.deepEqual(byId, getData[4]);

        const newItem = {
            "Newspaper": "My Paper",
            "Daily Circulation, 2004": 1,
            "Daily Circulation, 2013": 1,
            "Change in Daily Circulation, 2004-2013": 100,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 1,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 1,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 1
        };

        const addedItem = await circulationRepo(client).add(newItem);
        assert(addedItem._id);

        const addedItemQuery = await circulationRepo(client).getById(addedItem._id);
        assert.deepEqual(addedItem, addedItemQuery);

        const updatedItem = await circulationRepo(client).update(addedItem._id, {
            "Newspaper": "My New Paper",
            "Daily Circulation, 2004": 1,
            "Daily Circulation, 2013": 1,
            "Change in Daily Circulation, 2004-2013": 100,
            "Pulitzer Prize Winners and Finalists, 1990-2003": 1,
            "Pulitzer Prize Winners and Finalists, 2004-2014": 1,
            "Pulitzer Prize Winners and Finalists, 1990-2014": 1
        });
        assert.equal(updatedItem.Newspaper, "My New Paper");

        const newAddedItemQuery = await circulationRepo(client).getById(addedItem._id);
        assert.equal(newAddedItemQuery.Newspaper, "My New Paper");

        const removed = await circulationRepo(client).remove(addedItem._id);
        assert(removed.deletedCount === 1);

        const deletedItem = await circulationRepo(client).getById(addedItem._id);
        assert.equal(deletedItem, null);

        const avgFinalists = await circulationRepo(client).averageFinalists();
        console.log("avgFinalists " + avgFinalists);

        const avgByChange = await circulationRepo(client).averageFinalistsByChange();
        console.log(avgByChange);

    } catch (error) {
        console.log(error);
    } finally {
        await client.db(dbName).dropDatabase();

        const admin = client.db(dbName).admin();
        console.log(await admin.listDatabases());

        client.close();

        process.exit(0);
    }

};

main();
