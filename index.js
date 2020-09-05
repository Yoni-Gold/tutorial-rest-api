const express = require('express');
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
require('dotenv').config({path: './.env'});
const app = express();

app.use(express.static('./'));
app.use(express.json());

//app.use(express.static(path.join(__dirname, './build')));

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' });
}

////// mongoDB ////////

const url = process.env.DBURL;

const TutorialSchema = new mongoose.Schema({
  subject: String,
  title: String,
  content: String,
  author: String,
  date: Date,
  rating: Number,
  published: Boolean
});

TutorialSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString();
      delete returnedObject._id;
      delete returnedObject.__v;
    }
});

const Tutorial = mongoose.model('Tutorial', TutorialSchema);

///////////////////////

  
app.get('/api/tutorials', (req, res) => {
  mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
  if (req.query.title)
  {
    Tutorial.find({ title : { $regex: new RegExp('.*' + req.query.title + '.*', 'i') }}).then(result => {
        result.forEach(e => {
            console.log(e.toJSON());
            });
          mongoose.connection.close();
          return res.send(result);
    });
  }
  else
  {
    Tutorial.find({}).then(result => {
        result.forEach(e => {
        console.log(e.toJSON());
        });
    mongoose.connection.close();
    return res.send(result);
    });
  }
})

app.get('/api/tutorials/:id', async (req, res) => {
  mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
  if (req.params.id === "published")
  {
    Tutorial.find({published: true}).then(result => {
        result.forEach(e => {
        console.log(e.toJSON());
        });
    mongoose.connection.close();
    return res.send(result);
    });
  }
  Tutorial.find({_id: req.params.id}).then(result => {
    if (result[0])
    {
      mongoose.connection.close();
      return res.send(result[0].toJSON());
    }
    else 
    {
      mongoose.connection.close();
      return res.status(404).send("<h1>Tutorial not found</h1><p>the tutoral id you entered does not exist</p>");
    }
  });
})

app.post('/api/tutorials', (req , res) => {
    let body = req.body;
    if (!body.title || !body.content || !body.author || !body.subject)
    {
        return res.status(400).send("one of the attributes is missing");
    }
    try {
    mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const tutorial = new Tutorial({
        subject: body.subject,
        title: body.title,
        content: body.content,
        date: body.date || new Date(),
        author: body.author,
        rating: body.rating || 0.0,
        published: body.published || false
      });
  
      tutorial.save().then(result => {
        console.log('contact saved!');
        mongoose.connection.close();
        return res.send(`tutorial saved! 
        ${tutorial}`);
      });
    }

    catch(err)
    {
        return res.status(400).send(err.message);
    }
})

app.delete('/api/tutorials/:id', async (req, res) => {
  mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
  let tutorial = await Tutorial.find({_id: req.params.id}).then(result => result[0]);
  if (!tutorial)
  {
    mongoose.connection.close();
    return res.status(404).send("<h1>Tutorial not found</h1><p>the tutorial name you entered does not exist</p>");
  }
  else
  {
    Tutorial.findOneAndRemove({_id: req.params.id}).then(result => {
      mongoose.connection.close();
      console.log("item removed");
      return res.status(204).send(`Item Removed 
      ${tutorial.toJSON()}`);
    })
  }    
})

app.delete('/api/tutorials', async (req, res) => {
    mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    Tutorial.deleteMany({}).then(result => {
        mongoose.connection.close();
        return res.status(204).send("Cleared all tutorials");
    });
})

app.put('/api/tutorials/:id', async (req , res) => {
    mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    Tutorial.find({_id: req.params.id}).then(result => {
        if (result[0])
        {
            try {
                Tutorial.findByIdAndUpdate(req.params.id , req.body, { new: true }).then(result => {
                    return res.send(`Tutorial updated! 
                    ${result}`);
                });
            }

            catch(err)
            {
                return res.status(400).send(err.message);
            }
        }
        else
        {
            return res.status(404).send("Couldn't find tutorial to update");
        }
    })
})

app.use(unknownEndpoint);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})