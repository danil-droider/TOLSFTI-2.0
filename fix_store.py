import re

filepath = r'c:\Users\Danil\Desktop\ИИ\TOLSFTI 2.0\src\store\useGoalStore.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# The persist section ends with:
#   },
#   {
#     name: "goal-ticker-storage",
#     ...
#     migrate: migrateGoalStorage,
#   }
# )
#
# But currently it's broken. Let me fix the closing structure.

# Find the persist section and replace it
# We need to ensure proper closing: }, { ... } )

# Replace the problematic ending with correct structure
old = '''      }),
      version: 2,
      migrate: migrateGoalStorage,
    }
  )
'''
new = '''      }),
      version: 2,
      migrate: migrateGoalStorage,
    }
  )
'''

if old in content:
    content = content.replace(old, new)
    print('Already correct or replaced')
else:
    # Try a more flexible approach - find and replace the closing pattern
    # Look for the pattern and fix it
    persist_marker = 'persist('
    start = content.find(persist_marker)
    if start >= 0:
        # Find the last ")" that closes persist
        # Replace the closing braces/parens
        # The structure should be: reducer code, }, options object, ), EOF
        # Currently it seems to have extra } or wrong structure
        
        # Let me just ensure the file ends properly by finding and fixing
        # the specific lines mentioned in the TS error (line 340)
        
        # Let's find lines around the issue
        lines = content.split('\n')
        # Lines 334-340 (1-indexed) = indices 333-339
        # Let me look at what's there and fix
        
        # Replace from line "      })," onwards through the end
        # Find "      })," and what follows
        new_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            if '      }),' in line and i + 1 < len(lines) and 'version: 2,' in lines[i+1]:
                # We found the start - now we need to find the closing
                # Copy this line and look ahead
                new_lines.append(line)
                i += 1
                # Skip until we find the closing ")" of persist
                # We need: }, { ... , }  )
                brace_count = 0
                found_close = False
                while i < len(lines) and not found_close:
                    l = lines[i]
                    new_lines.append(l)
                    # Count braces
                    brace_count += l.count('{') - l.count('}')
                    if '})' in l and brace_count <= 0:
                        found_close = True
                    i += 1
                # Now we should have the closing ")" - but we may have extra
                # Let's just ensure the structure ends with ")"
                # Actually, let me just rewrite the whole file properly
                break
            else:
                new_lines.append(line)
                i += 1
        
        content = '\n'.join(new_lines)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('File updated')

# Let me take a completely different approach - rewrite the whole file from scratch