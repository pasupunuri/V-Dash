#!/usr/bin/env ruby

require 'mongo'

# MongoDB connection configuration
MONGO_URI = ENV['MONGO_URI'] || 'mongodb://localhost:27017/your_database_name'

def connect_to_mongo
  puts "Connecting to MongoDB..."
  client = Mongo::Client.new(MONGO_URI)
  puts "✓ Connected successfully"
  client
end

def fetch_all_property_ids(client)
  puts "\nFetching all property IDs..."

  # Assuming properties are stored in a 'properties' collection
  # Adjust collection name and field name as needed
  properties = client[:properties].find.to_a
  property_ids = properties.map { |p| p['_id'] }

  puts "✓ Found #{property_ids.length} properties"
  property_ids
end

def fetch_admin_users(client)
  puts "\nFetching admin users..."

  # Find all users with role 'admin' (case-insensitive)
  admin_users = client[:users].find({
    'role' => /^admin$/i
  }).to_a

  puts "✓ Found #{admin_users.length} admin users:"
  admin_users.each do |user|
    email = user['email'] || user['username'] || user['_id']
    current_props = user['property_ids']&.length || 0
    puts "  - #{email} (current properties: #{current_props})"
  end

  admin_users
end

def update_admin_users(client, admin_users, property_ids)
  puts "\nUpdating admin users with all property IDs..."

  success_count = 0
  fail_count = 0

  admin_users.each do |user|
    begin
      result = client[:users].update_one(
        { '_id' => user['_id'] },
        { '$set' => { 'property_ids' => property_ids } }
      )

      email = user['email'] || user['username'] || user['_id']
      puts "✓ Updated #{email}"
      success_count += 1
    rescue => e
      puts "✗ Failed to update #{user['email']}: #{e.message}"
      fail_count += 1
    end
  end

  puts "\n" + "=" * 60
  puts "Summary:"
  puts "  Success: #{success_count}"
  puts "  Failed:  #{fail_count}"
  puts "  Total:   #{admin_users.length}"
  puts "=" * 60
end

# Main execution
begin
  puts "=" * 60
  puts "Admin Users Property Assignment Script"
  puts "=" * 60

  # Connect to MongoDB
  client = connect_to_mongo

  # Fetch all property IDs
  property_ids = fetch_all_property_ids(client)

  # Fetch admin users
  admin_users = fetch_admin_users(client)

  if admin_users.empty?
    puts "\nNo admin users found. Exiting..."
    exit 0
  end

  # Update admin users
  update_admin_users(client, admin_users, property_ids)

  # Close connection
  client.close
  puts "\n✓ Done!"

rescue => e
  puts "\nError: #{e.message}"
  puts e.backtrace
  exit 1
end