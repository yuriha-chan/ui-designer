# Tutorial: Creating a Mockup of an Online Bookstore

This tutorial explains how to use the tool to design screens for an online bookstore. While we're using a bookstore as an example, the workflow itself is the same whether you're building a chat app, a role-playing game, or a local coupon app.

## What Are We Building?

### The First Thing to Consider: What Kind of Data Does the App Handle?

Think about what an online bookstore is. Typically, it's a site where you can browse a list of books, check prices, add items to a cart, place orders, and check the status of those orders. If an app can do these things, users will feel they're using a proper online bookstore.

On the listing screen, book titles and prices are displayed. For example, "Comic X" might be sold for 800 yen. The bookstore sets this price, and that data is stored somewhere. What you see in the browser is that stored data.

Next, when you proceed to the checkout screen, you confirm the contents of your cart and verify your registered home address. Once the order is complete, the book will arrive later. The bookstore remembers the address you previously registered, so you don't have to enter it each time. And, of course, for other customers, it remembers and displays *their* addresses.

In this way, a bookstore app stores and displays at least two types of "objects": "books" and "customers". These are called **entities**. An entity is an object that the system handles. In many programming languages, these are also called "objects", so that term might be more familiar.

### Real Software vs. Mockups
If we tried to build a real online bookstore right now, we'd need to write code to connect to an actual database, set up a server, and even handle payment processing. That could take months.

So, as a preliminary step, we create a **mockup**.

A mockup is like a digital storyboard, made of multiple picture cards. It's a model that only *appears* to function on the surface; it doesn't actually save data to a database or process payments. It doesn't perform calculations either—it simply shows pre-written "answers" like a picture-story show. It arranges screen visuals and lets you "flip the card" to the next screen when you press a button.

By using this picture card storyboard, you can actually click through the flow, test it, and show it to others to verify whether the app's structure makes sense. It's a way to validate the overall logic before investing time in implementation.

### Detailed Mockups vs. Abstract Mockups

Once you've decided to create a mockup, the next question is how detailed to make it.

Beginners often try to create highly detailed mockups. They spend time fine-tuning the green color of a "Buy" button, adjusting font sizes, or aligning elements pixel by pixel to make the screen look as realistic as possible. However, if they later realize that the button should have been placed on a different screen altogether, most of that work ends up being wasted. Even if you are working on a project for learning or as a hobby, finishing nothing more than a meticulously refined "Buy" button does not give you the most important values—the experience, confidence, and satisfaction of actually building a finished product.

That is why this tool is strictly for creating abstract mockups. Colors do not exist. Fonts cannot be specified. You cannot move a button five pixels to the left. You cannot even specify the order of components—they are automatically arranged. These stoic constraints prevent you from spending time on visual adjustments.

Instead, it forces you to focus on decisions about structure:

- What data does this screen contain?
- Should a certain combination of data be presented as a single unit or as separate pieces of information?
- What buttons are there, and where does each button lead?

Because you're not distracted by visual details, you can create the entire picture-story show in a short amount of time. Let's start building.

## Creating a Mockup of a Bookstore App

### Step 1: Define Entities

First, you need to tell the tool about the "book" object.

Look at the side panel on the right. The "Entities" tab is selected by default.
Click "+ Add Entity" to add a new item, and name it "Book".

Next, define the information this entity holds. Click "Add Property", and set the first item to "Title". The type is `string`.

Click "Add Property" again, enter "Price", and change the type to `number`.

This defines the "Book" entity.

Similarly, create a "Customer" entity with two string properties: "Name" and "Address".

### Step 2: Prepare the Screens

Next, create the screens, which are the cards for your picture-story show.

Open the "Screens" tab in the side panel, enter "Sales Screen" in the input field, and add it. Then add "Checkout Screen" and "Purchase Complete Screen" as well.

Select "Sales Screen" from the list. The left area becomes the editing area for the "Sales Screen". It should appear blank.

### Step 3: Place Content on the Screen (Components)

To display books on the sales screen, you use parts called **components**.

Right-click on the blank area to open a menu.

- **Container**: a box for grouping
- **Text**: for displaying text
- **Number**: for displaying numeric values
- **Button**: a clickable element
- **Input**: an input field

Let's create the display for one book.

1. Right-click and select "Container".
2. Right-click *inside* the added container and choose "Text".
3. A menu for "Entity Path" will appear. "Entity Path" asks: which property of which entity should this text component display? Select "Book", then choose "Title" from the expanded list.
4. The component "Book > Title" is added to the container.
5. Right-click on an empty area inside the container again and select "Number". Then choose "Book" → "Price".
6. Finally, add a "Button" to the container and select "Select" as the label.

Now you have the display for one book. Specifically, imagine it showing data like "Comic X" and "800 yen".

Next, to arrange multiple books, copy this container. Use the Copy button in the top-right corner and duplicate it until it looks like a typical online bookstore page. Arranging about five books should give it the right look.

### Step 4: Connect Screens

Make it so that pressing a button advances to the next screen.

Look at the button you created. It has a dropdown menu. Select "Select Screen" and specify the "Checkout Screen".

This sets up the screen transition. The "flow" is now complete.

### Step 5: Create Other Screens

Now edit the checkout screen. Select "Checkout Screen" from the screen panel, and add components to display Book → Title, Book → Price, Customer → Name, and Customer → Address. Then place an "OK" button.

Next, create the "Purchase Complete Screen". Place a text component here, and set the display string to the "..." option at the top. This is meant for a message like "Purchase completed" or "Thank you," but the exact wording isn't important now. Similarly, add an "OK" button and set it to return to the Sales Screen.

### Step 6: Test It with Preview

At this point, you have data definitions, screen layouts, and button transitions all in place.

Click "Preview" in the menu bar at the top of the screen. The designer UI will disappear, leaving only the actual display, and buttons will become clickable.

You can verify that pressing buttons switches to the Checkout Screen and then to the Purchase Complete Screen.

### Step 7: Change Property Names

Suppose you want to change the property name "Address" to "Shipping Address".
In the entity panel on the side, click on "Address". It will become an input field. Type "Shipping Address" and press Enter. The property name is changed, and all related components will update automatically—no further action is needed.

## Tips

For example, if you have a container representing a card and want to express that clicking anywhere on the card triggers an action, you can add an OK button to the container and have pressing that button transition to another screen.

Similarly, if you want to express dragging and dropping a card, you can simulate it by having a "Select" button that chooses the card to move, transitions to a "specify destination" screen, and then an OK button there performs the move. This approach not only simulates the drag mechanism with buttons but is also very helpful later when implementing actual drag-and-drop correctly. Using the screen copy feature is quick for creating the "specify destination" screen.

If you're designing an app where the screen transitions after a few seconds or after an animation finishes, use an OK button to proceed. It's easier to handle pauses during the design review.

If you make a mistake, don't panic—just press the "Undo" button to revert.

## What's Next?

At this stage, you have a clickable mockup. You've confirmed that the app structure works without writing complex code or spending time on visual details.

Once you've created all screens similarly, you can save using the "Export" button at the top. Saving in JSON format allows you to reload it later and continue working.

You can also export it as "LLM Text". While this format cannot be reloaded, it provides a text description of the picture-story show's structure. You can input this text into an AI (Claude is recommended) to generate a highly realistic mockup with colors and styles.
