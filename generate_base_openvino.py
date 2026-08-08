import tensorflow as tf
import os

# Create exactly the same MLP
model = tf.keras.Sequential([
    tf.keras.layers.Dense(32, activation='relu', input_shape=(63,)),
    tf.keras.layers.Dense(16, activation='relu'),
    tf.keras.layers.Dense(3, activation='softmax')
])

# Build model
model.build((None, 63))

# Save the tf model
model_path = "dummy_tf_model"
model.save(model_path)

# Convert to OpenVINO IR
os.system(f"ovc {model_path} --output_model src/vendor/gesture_mlp_base.xml --compress_to_fp16=False")

print("Generated src/vendor/gesture_mlp_base.xml and .bin")
