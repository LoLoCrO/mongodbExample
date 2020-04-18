import { dbName } from '../constants';
import mongo from 'mongodb';

const circulationRepo = (client) => {

    const { ObjectID } = mongo;
    const newspapers = client.db(dbName).collection('newspapers');

    const get = async (query, limit) => new Promise(async (resolve, reject) => {
        try {
            let items = await newspapers.find(query);
            if (limit > 0) {
                items = items.limit(limit);
            }
            resolve(items.toArray());
        } catch (error) {
            reject(error);
        }
    }).catch(err => console.log(err));

    const getById = async (id) => new Promise(async (resolve, reject) => {
        try {
            const item = await newspapers.findOne({ _id: ObjectID(id) })
            resolve(item);
        } catch (error) {
            reject(error);
        }
    }).catch(err => console.log(err));

    const loadData = (data) => new Promise(async (resolve, reject) => {
        try {
            const results = await newspapers.insertMany(data);
            resolve(results);
        } catch (error) {
            reject(error);
        }
    }).catch(err => console.log(err));

    const add = (item) => new Promise(async (resolve, reject) => {
        try {
            const addedItem = await newspapers.insertOne(item);
            resolve(addedItem.ops[0]);
        } catch (error) {
            reject(error);
        }
    }).catch(err => console.log(err));

    const update = (id, newItem) => new Promise(async (resolve, reject) => {
        try {
            const updatedItem = await newspapers
                .findOneAndReplace({ _id: ObjectID(id) }, newItem, { returnOriginal: false });
            resolve(updatedItem.value);
        } catch (error) {
            reject(error);
        }
    }).catch(err => console.log(err));

    const remove = (id) => new Promise(async (resolve, reject) => {
        try {
            const removed = newspapers.deleteOne({ _id: ObjectID(id) });
            resolve(removed);
        } catch (error) {
            reject(error);
        }
    }).catch(err => console.log(err));

    const averageFinalists = () => new Promise(async (resolve, reject) => {
        try {
            const average = await newspapers.aggregate([{
                $group: {
                    _id: null,
                    avgFinalists: { $avg: "$Pulitzer Prize Winners and Finalists, 1990-2014" }
                }
            }]).toArray();
            resolve(average[0].avgFinalists);
        } catch (error) {
            reject(error);
        }
    }).catch(err => console.log(err));

    const averageFinalistsByChange = () => new Promise(async (resolve, reject) => {
        try {
            const average = await newspapers.aggregate([
                {
                    $project: {
                        "Newspaper": 1,
                        "Pulitzer Prize Winners and Finalists, 1990-2014": 1,
                        "Change in Daily Circulation, 2004-2013": 1,
                        overallChange: {
                            $cond: {
                                if: { $gte: ["$Change in Daily Circulation, 2004-2013", 0] },
                                then: "positive",
                                else: "negative"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$overallChange",
                        avgFinalists: { $avg: "$Pulitzer Prize Winners and Finalists, 1990-2014" }
                    }
                }
            ]).toArray();
            resolve(average);
        } catch (error) {
            reject(error);
        }
    }).catch(err => console.log(err));

    return { loadData, get, getById, add, update, remove, averageFinalists, averageFinalistsByChange };
};

export default circulationRepo;